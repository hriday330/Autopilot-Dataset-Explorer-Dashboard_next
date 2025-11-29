import { createSupabaseServerClient } from "@lib//server/supabaseClient";

export async function getDatasetsForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const {data, error} = await supabase
    .from("datasets")
    .select("*")
    .eq("user_id", userId);
  
  if (error) {
    console.log(error)
  }

  return {data, error}
}
