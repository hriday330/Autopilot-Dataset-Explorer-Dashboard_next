import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

serve(async (req) => {
  try {
    const { datasetId, datasetName, userId, zipPath } = await req.json();

    if (!datasetId || !datasetName || !userId || !zipPath) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const url = Deno.env.get("PROJECT_URL")!;
    const serviceKey = Deno.env.get("SERVICE_ROLE")!;

    const supabase = createClient(url, serviceKey);

    // 1. Download the ZIP file from Supabase Storage
    const { data: zipFile, error: downloadErr } = await supabase.storage
      .from("datasets")
      .download(zipPath);

    if (downloadErr || !zipFile) {
      return new Response(
        JSON.stringify({ success: false, error: downloadErr?.message }),
        { status: 500 },
      );
    }

    const arrayBuf = await zipFile.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuf);

    // 2. Find image files inside ZIP
    const entries = Object.values(zip.files).filter((f) => {
      const lower = f.name.toLowerCase();
      return (
        !f.dir &&
        (lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.endsWith(".webp"))
      );
    });

    const rows: { dataset_id: string; storage_path: string }[] = [];

    // 3. Process each image (upload to Supabase Storage)
    for (const entry of entries) {
      const fileData = await entry.async("uint8array");
      const filename = entry.name.split("/").pop()!;
      const storagePath = `${userId}/${datasetName}/${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from("datasets")
        .upload(storagePath, fileData, { upsert: true });

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        throw uploadErr;
      }

      rows.push({
        dataset_id: datasetId,
        storage_path: storagePath,
      });
    }

    // 4. Batch insert into images table
    const BATCH = 2000;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);

      const { error: insertErr } = await supabase
        .from("images")
        .insert(batch);

      if (insertErr) {
        console.error("Insert error:", insertErr);
        throw insertErr;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: rows.length,
      }),
      { status: 200 },
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500 },
    );
  }
});
