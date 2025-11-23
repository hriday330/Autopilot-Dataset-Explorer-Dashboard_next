import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const { datasetId, datasetName, userId, zipPath } = await req.json();

    if (!datasetId || !datasetName || !userId || !zipPath) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const url = Deno.env.get("PROJECT_URL")!;
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, serviceKey);

    // 1. Download ZIP
    const { data: zipFile, error: downloadErr } = await supabase.storage
      .from("datasets")
      .download(zipPath);

    if (downloadErr || !zipFile) {
      return new Response(
        JSON.stringify({ success: false, error: downloadErr?.message }),
        { status: 500, headers: corsHeaders },
      );
    }

    const arrayBuf = await zipFile.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuf);

    // 2. Filter images
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

    // 3. Upload tasks (with concurrency limiter)
    const uploadTasks = entries.map((entry) => async () => {
      const fileData = await entry.async("uint8array");
      const filename = entry.name.split("/").pop()!;
      const storagePath = `${userId}/${datasetName}/${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from("datasets")
        .upload(storagePath, fileData, { upsert: true });

      if (uploadErr) throw uploadErr;

      rows.push({ dataset_id: datasetId, storage_path: storagePath });
    });

    await limitConcurrency(8, uploadTasks, (task) => task());

    // 4. Insert into DB in batches
    const BATCH = 2000;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error: insertErr } = await supabase.from("images").insert(batch);
      if (insertErr) throw insertErr;
    }

    return new Response(
      JSON.stringify({ success: true, inserted: rows.length }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    console.error("ERROR in upload:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: corsHeaders },
    );
  }
});

// Concurrency limiter
async function limitConcurrency(poolSize, items, fn) {
  const ret = [];
  const executing = new Set();

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    ret.push(p);
    executing.add(p);

    p.finally(() => executing.delete(p));

    if (executing.size >= poolSize) {
      await Promise.race(executing);
    }
  }

  return Promise.all(ret);
}
