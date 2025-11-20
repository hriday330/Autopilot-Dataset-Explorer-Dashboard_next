"use server";

import { supabaseServer } from "@lib/supabaseServer";

export async function fetchAnnotationsForImage(imageId: string) {
  const { data, error } = await supabaseServer
    .from("annotations")
    .select("*")
    .eq("image_id", imageId);

  if (error) {
    console.error("Fetch annotations error:", error);
    return [];
  }

  return data || [];
}

export async function saveAnnotationsForImage(
  imageId: string,
  boxes: any[],
  userId: string
) {

  const { error: delErr } = await supabaseServer
    .from("annotations")
    .delete()
    .eq("image_id", imageId);

  if (delErr) {
    console.error("Delete annotation error:", delErr);
    return { error: delErr.message };
  }

  const payload = boxes.map((b) => ({
    image_id: imageId,
    user_id: userId,
    label: b.label,
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
  }));

  if (payload.length === 0) {
    return { success: true }; // nothing to insert
  }

  const { error: insErr } = await supabaseServer
    .from("annotations")
    .insert(payload);

  if (insErr) {
    console.error("Insert annotation error:", insErr);
    return { error: insErr.message };
  }

  return { success: true };
}
