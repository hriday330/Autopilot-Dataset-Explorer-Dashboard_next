import { supabaseServer } from "@lib/supabaseServer";

export async function POST(req: Request) {
  const { datasetId, storagePath, isZip } = await req.json();

  if (isZip) {
    return Response.json({
      success: true,
      isZip: true,
      zipPath: storagePath,
    });
  }

  const { data, error } = await supabaseServer
    .from("images")
    .insert({
      dataset_id: datasetId,
      storage_path: storagePath,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    isZip: false,
    thumbnails: [
      {
        id: data.id,
        url: "",
        storage_path: storagePath,
      },
    ],
  });
}
