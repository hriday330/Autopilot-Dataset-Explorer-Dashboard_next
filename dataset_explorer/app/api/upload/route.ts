import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import JSZip from "jszip";
import pLimit from "p-limit";
import sharp from "sharp";

const CONCURRENCY = 10;
const BATCH = 2000;

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const datasetId = form.get("datasetId") as string;
    const datasetName = form.get("datasetName") as string;
    const userId = form.get("userId") as string;
    const files = form.getAll("files") as File[];

    if (!datasetId || !datasetName || !userId) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const file = files[0];
    
    if (file.name.endsWith(".zip")) {
      const zipBuf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(zipBuf);

      const entries = Object.values(zip.files).filter(f => {
        const lower = f.name.toLowerCase();
        return (
          !f.dir &&
          (lower.endsWith(".jpg") ||
            lower.endsWith(".jpeg") ||
            lower.endsWith(".png") ||
            lower.endsWith(".webp"))
        );
      });

      const limit = pLimit(CONCURRENCY);
      const rows: any[] = [];

      await Promise.all(
        entries.map(entry =>
          limit(async () => {
            const blob = await entry.async("nodebuffer");
            const filename = entry.name.split("/").pop()!;
            const storagePath = `${userId}/${datasetName}/${filename}`;

            let compressed: Buffer;

            try {
              compressed = await sharp(blob)
                .rotate() 
                .resize({ width: 2000, withoutEnlargement: true }) // better network perf
                .webp({
                  quality: 70,
                  effort: 5,     
                })
                .toBuffer();
            } catch (err) {
              console.error("Sharp compression failed, falling back to raw buffer:", err);
              compressed = blob; 
            }
              const { error: uploadErr } = await supabaseServer.storage
                .from("datasets")
                .upload(storagePath, compressed, { upsert: true });

              if (uploadErr) throw uploadErr;

              rows.push({
                dataset_id: datasetId,
                storage_path: storagePath,
                width: null,
                height: null,
              });
          })
        )
      );

      const inserted: any[] = [];

      // Batch DB insert
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { data, error } = await supabaseServer.from("images").insert(batch).select();

        if (error) throw error;
        inserted.push(...data);
      }

      return NextResponse.json({
        success: true,
        thumbnails: inserted.map((row) => ({
          id: row.id,
          url: "",
          storage_path: row.storage_path,
        })),
        isZip: file.name.endsWith(".zip"),
      });
    }

    const thumbnails: any[] = [];

    for (const file of files) {
      const storagePath = `${userId}/${datasetName}/${file.name}`;

      const { error: uploadErr } = await supabaseServer.storage
        .from("datasets")
        .upload(storagePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data, error: insertErr } = await supabaseServer
        .from("images")
        .insert({
          dataset_id: datasetId,
          storage_path: storagePath,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      thumbnails.push({
        id: data.id,
        url: "",
        storage_path: storagePath,
      });
    }

    return NextResponse.json({ success: true, thumbnails });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
