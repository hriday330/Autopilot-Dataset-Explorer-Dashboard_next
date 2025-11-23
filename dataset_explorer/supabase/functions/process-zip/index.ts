import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { unzipSync } from "https://esm.sh/fflate@0.8.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const url = Deno.env.get("PROJECT_URL")!;
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, serviceKey);

    const { data: zipFile, error: downloadErr } = await supabase.storage
      .from("datasets")
      .download(zipPath);

    if (downloadErr || !zipFile) {
      return new Response(
        JSON.stringify({ success: false, error: downloadErr?.message }),
        { status: 500, headers: corsHeaders },
      );
    }

    const uint8 = new Uint8Array(await zipFile.arrayBuffer());
    const extracted = unzipSync(uint8); // { "path/to/file.jpg": Uint8Array }

    const imageEntries = Object.entries(extracted).filter(([name]) => {
      const lower = name.toLowerCase();
      return (
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp")
      );
    });

    const rows: { dataset_id: string; storage_path: string }[] = [];

    const uploadTasks = imageEntries.map(([name, fileData]) => async () => {
      const filename = name.split("/").pop()!;
      const storagePath = `${userId}/${datasetName}/${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from("datasets")
        .upload(storagePath, fileData, { upsert: true });

      if (uploadErr) throw uploadErr;

      rows.push({
        dataset_id: datasetId,
        storage_path: storagePath,
      });
    });

    await limitConcurrency(8, uploadTasks, (task) => task());

    const BATCH = 2000;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);

      const { error: insertErr } = await supabase.from("images").insert(batch);

      if (insertErr) throw insertErr;
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: rows.length,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    console.error("ERROR:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: corsHeaders },
    );
  }
});

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
