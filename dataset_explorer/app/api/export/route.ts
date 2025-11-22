import { NextResponse } from "next/server";
import { supabaseServer } from "@lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { datasetId } = await req.json();
    if (!datasetId) {
      return NextResponse.json({ error: "Missing datasetId" }, { status: 400 });
    }

    const { data: imagesData, error: imgErr } = await supabaseServer
      .from("images")
      .select("*")
      .eq("dataset_id", datasetId)

    if (imgErr) throw imgErr;

    const { data: annData, error: annErr } = await supabaseServer
      .from("annotations")
      .select("*")
      .eq("dataset_id", datasetId);

    if (annErr) throw annErr;


    const { data: labelsData, error: labelErr } = await supabaseServer
      .from("label_classes")
      .select("*")
      .eq("dataset_id", datasetId)
      .order("order_index");

    if (labelErr) throw labelErr;

    const categories = labelsData.map((l, index) => ({
      id: index + 1,
      name: l.name,
      supercategory: "none",
      _labelId: l.id, // internal use
    }));

    const catMap = new Map(
      categories.map((c) => [c._labelId, c.id])
    );

    // 5. COCO images
    const images = imagesData.map((img, index) => ({
      id: index + 1,
      file_name: img.url,
      width: img.width ?? 0,
      height: img.height ?? 0,
      _imageId: img.id,
    }));

    const imgMap = new Map(
      images.map((i) => [i._imageId, i.id])
    );

    // 6. COCO annotations
    let annId = 1;
    const annotations = annData.map((a) => ({
      id: annId++,
      image_id: imgMap.get(a.image_id),
      category_id: catMap.get(a.label_id),
      bbox: [a.x, a.y, a.width, a.height],
      area: a.width * a.height,
      iscrowd: 0,
    }));

    // Cleanup COCO output
    const cleanCategories = categories.map(({ _labelId, ...rest }) => rest);
    const cleanImages = images.map(({ _imageId, ...rest }) => rest);

    const coco = {
      info: {
        description: "Dataset export",
        version: "1.0",
        year: new Date().getFullYear(),
        date_created: new Date().toISOString(),
      },
      licenses: [],
      images: cleanImages,
      annotations,
      categories: cleanCategories,
    };

    const json = JSON.stringify(coco, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="dataset-${datasetId}.json"`,
      },
    });
  } catch (err: any) {
    console.error("EXPORT ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
