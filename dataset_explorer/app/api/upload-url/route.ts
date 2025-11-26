
import { supabaseServer } from "@lib/supabaseServer";

export async function POST(req: Request) {
  const { fileName, fileType, userId, datasetName } = await req.json();

  if (!fileName || !fileType || !userId || !datasetName) {
    return Response.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const storagePath = `${userId}/${datasetName}/${fileName}`;
  
  const { data, error } = await supabaseServer.storage
    .from("datasets")
    .createSignedUploadUrl(storagePath);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    uploadUrl: data.signedUrl,
    storagePath,
  });
}
