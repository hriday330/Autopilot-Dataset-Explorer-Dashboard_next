import { ImageThumbnail } from "@lib/types";
import { NextResponse } from "next/server";

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { thumbnails, boxes }: { thumbnails: ImageThumbnail[], boxes: Record<string,BoundingBox[]>}= body;

    if (!thumbnails || !boxes) {
      return NextResponse.json(
        { error: "Missing thumbnails or boxes in request body" },
        { status: 400 }
      );
    }
  
    const categoryNames = new Set<string>();
    Object.values(boxes).forEach((arr: BoundingBox[]) => {
      arr?.forEach((b) => categoryNames.add(b.label));
    });

    const categories = Array.from(categoryNames).map((name, index) => ({
      id: index + 1,
      name,
      supercategory: "none",
    }));

    const categoryIdMap = new Map(
      categories.map((c) => [c.name, c.id])
    );

    const images = thumbnails.map((img: ImageThumbnail, index: number) => ({
      id: index + 1,
      file_name: img.url, 
      width: img.width ?? 0,
      height: img.height ?? 0,
    }));

    const imageIdMap = new Map(
      thumbnails.map((img: ImageThumbnail, index: number) => [img.id, index + 1])
    );

    let annId = 1;
    const annotations: any[] = [];

    thumbnails.forEach((img: ImageThumbnail, index: number) => {
      const imageId = imageIdMap.get(img.id);
      const anns = boxes[img.id] || [];

      anns.forEach((b: BoundingBox) => {
        annotations.push({
          id: annId++,
          image_id: imageId,
          category_id: categoryIdMap.get(b.label),
          bbox: [b.x, b.y, b.width, b.height],
          area: b.width * b.height,
          iscrowd: 0,
        });
      });
    });

    const coco = {
      info: {
        description: "Dataset export",
        version: "1.0",
        year: new Date().getFullYear(),
        date_created: new Date().toISOString(),
      },
      licenses: [],
      images,
      annotations,
      categories,
    };

    const json = JSON.stringify(coco, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="coco-export-${new Date()
          .toISOString()
          .split("T")[0]}.json"`,
      },
    });
  } catch (err: any) {
    console.error("COCO export error:", err);
    return NextResponse.json(
    { error: err?.message ?? "Unknown export error" },
    { status: 500 }
    );
  }
}
