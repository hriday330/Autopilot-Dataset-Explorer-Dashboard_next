import { unzipSync } from "fflate";

export async function extractImagesFromZip(file: File) {
  const buffer = await file.arrayBuffer();
  const files = unzipSync(new Uint8Array(buffer));

  const results: { name: string; blob: Blob }[] = [];

  for (const [name, data] of Object.entries(files)) {
    const arr = data;

    const lower = name.toLowerCase();
    if (
      !lower.endsWith(".jpg") &&
      !lower.endsWith(".jpeg") &&
      !lower.endsWith(".png") &&
      !lower.endsWith(".webp")
    ) continue;

    const mime =
      lower.endsWith(".png")
        ? "image/png"
        : lower.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";

    results.push({
      name,
      blob: new Blob([arr as BlobPart], { type: mime }),
    });
  }

  return results;
}
