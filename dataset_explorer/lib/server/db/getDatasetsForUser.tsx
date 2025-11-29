import { createSupabaseServerClient } from "@lib//server/supabaseClient";

export async function getDatasetsForUser(userId: string) {
  const supabase = await createSupabaseServerClient();

  return supabase
    .from("datasets")
    .select("*")
    .eq("user_id", userId);
}
