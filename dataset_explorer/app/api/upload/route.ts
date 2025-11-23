import { NextResponse } from "next/server";
import { supabaseServer } from "@lib/supabaseServer";

export const runtime = "nodejs";

// This route ONLY uploads files to storage.
// ZIPs are not processed here; only stored.
// The caller then triggers the Edge Function.

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const datasetId = form.get("datasetId") as string;
    const datasetName = form.get("datasetName") as string;
    const userId = form.get("userId") as string;
    const files = form.getAll("files") as File[];

    if (!datasetId || !datasetName || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // We handle only ONE ZIP at a time
    const file = files[0];
    const isZip = file.name.toLowerCase().endsWith(".zip");

    // If ZIP → store it & return zipPath
    if (isZip) {
      const zipStoragePath = `${userId}/${datasetName}/${file.name}`;

      const { error: uploadErr } = await supabaseServer.storage
        .from("datasets")
        .upload(zipStoragePath, file, { upsert: true });

      if (uploadErr) {
        return NextResponse.json(
          { success: false, error: uploadErr.message },
          { status: 500 }
        );
      }

      // frontend will call edge function with this zipPath
      return NextResponse.json({
        success: true,
        isZip: true,
        zipPath: zipStoragePath,
      });
    }

    // Otherwise → normal multi-file upload
    const thumbnails: any[] = [];

    for (const file of files) {
      const storagePath = `${userId}/${datasetName}/${file.name}`;

      const { error: uploadErr } = await supabaseServer.storage
        .from("datasets")
        .upload(storagePath, file, { upsert: true });

      if (uploadErr)
        return NextResponse.json(
          { success: false, error: uploadErr.message },
          { status: 500 }
        );

      const { data, error: insertErr } = await supabaseServer
        .from("images")
        .insert({
          dataset_id: datasetId,
          storage_path: storagePath,
        })
        .select()
        .single();

      if (insertErr)
        return NextResponse.json(
          { success: false, error: insertErr.message },
          { status: 500 }
        );

      thumbnails.push({
        id: data.id,
        url: "",
        storage_path: storagePath,
      });
    }

    return NextResponse.json({
      success: true,
      isZip: false,
      thumbnails,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
