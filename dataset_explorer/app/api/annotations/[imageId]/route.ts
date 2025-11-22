import { NextResponse } from "next/server";
import { supabaseServer } from "@lib/supabaseServer";

export async function GET(
  req: Request,
  { params }: { params: { imageId: string } }
) {
  try {
    const imageId = params.imageId;

    const { data, error } = await supabaseServer
      .from("annotations")
      .select("*")
      .eq("image_id", imageId);

    if (error) {
      console.error("Fetch annotations error:", error);
      return NextResponse.json({ annotations: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ annotations: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ annotations: [], error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { imageId: string } }
) {
  try {
    const imageId = params.imageId;
    const { boxes, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: imageRow, error: imgErr } = await supabaseServer
      .from("images")
      .select("dataset_id")
      .eq("id", imageId)
      .single();

    if (imgErr || !imageRow?.dataset_id) {
      return NextResponse.json(
        { error: "Image dataset not found" },
        { status: 400 }
      );
    }

    const datasetId = imageRow.dataset_id;

    await supabaseServer
      .from("annotations")
      .delete()
      .eq("image_id", imageId);
    if (!boxes || boxes.length === 0) {
      return NextResponse.json({ success: true });
    }

    const payload = boxes.map((b: any) => ({
      image_id: imageId,
      dataset_id: datasetId,
      user_id: userId,
      label: b.label,   
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
    }));

    const { error: insErr } = await supabaseServer
      .from("annotations")
      .insert(payload);

    if (insErr) {
      console.error("Insert annotation error:", insErr);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

