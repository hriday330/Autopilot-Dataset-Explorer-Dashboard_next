import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const datasetId = formData.get("datasetId") as string;
    const datasetName = formData.get("datasetName") as string;
    const userId = formData.get("userId") as string;
    const files = formData.getAll("files") as File[];

    if (!datasetId || !datasetName || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadedImages: any[] = [];

    for (const file of files) {
      const storagePath = `${userId}/${datasetName}/${file.name}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabaseServer.storage
        .from("datasets")
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Try to get dimensions if it's an image
      let width: number | null = null;
      let height: number | null = null;

      if (file.type?.startsWith("image/")) {
        try {
          const buffer = await file.arrayBuffer();
          const blob = new Blob([buffer], { type: file.type });
          const url = URL.createObjectURL(blob);

          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              width = img.naturalWidth;
              height = img.naturalHeight;
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            img.src = url;
          });
        } catch (_) {}
      }

      // Insert DB record
      const { data: imgData, error: imgErr } = await supabaseServer
        .from("images")
        .insert({
          dataset_id: datasetId,
          storage_path: storagePath,
          width,
          height,
        })
        .select()
        .single();

      if (imgErr) throw imgErr;

      // Create signed preview URL
      const signed = await supabaseServer.storage
        .from("datasets")
        .createSignedUrl(storagePath, 3600);

      const signedUrl =
        (signed as any).data?.signedUrl ||
        (signed as any).data?.signedURL ||
        (signed as any).data?.publicUrl ||
        (signed as any).publicURL ||
        "";

      uploadedImages.push({
        id: imgData.id,
        url: signedUrl,
        storage_path: storagePath,
      });
    }

    return NextResponse.json({
      success: true,
      thumbnails: uploadedImages,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message ?? "Upload failed",
        thumbnails: [],
      },
      { status: 500 }
    );
  }
}
