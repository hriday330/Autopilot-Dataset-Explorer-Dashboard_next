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
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // DELETE old annotations
    const { error: delErr } = await supabaseServer
      .from("annotations")
      .delete()
      .eq("image_id", imageId);

    if (delErr) {
      console.error("Delete annotation error:", delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // If empty, we're done
    if (!boxes || boxes.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Build new rows
    const payload = boxes.map((b: any) => ({
      image_id: imageId,
      user_id: userId,
      label: b.label,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
    }));

    // INSERT
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
