import { ImageThumbnail } from "@lib/types";
import { NextResponse } from "next/server";

/**
 * Expects:
 * {
 *   datasetId: string,
 *   thumbnails: Array<{ id: string, url: string }>,
 *   boxes: Record<string, BoundingBox[]>,
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { thumbnails, boxes } = body;

    if (!thumbnails || !boxes) {
      return NextResponse.json(
        { error: "Missing thumbnails or boxes in request body" },
        { status: 400 }
      );
    }

    const totalFrames = thumbnails.length;

    const exportData = {
      exportDate: new Date().toISOString(),
      totalFrames,
      labeledFrames: Object.keys(boxes).filter(
        (key) => boxes[key]?.length > 0
      ).length,
      frames: thumbnails.map((img: ImageThumbnail, index:number) => ({
        frameId: index,
        imageUrl: img.url,
        metadata: {},
        annotations: boxes[img.id] || [],
      })),
    };

    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="annotated-dataset-${new Date()
          .toISOString()
          .split("T")[0]}.json"`,
      },
    });
  } catch (err: any) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown export error" },
      { status: 500 }
    );
  }
}
