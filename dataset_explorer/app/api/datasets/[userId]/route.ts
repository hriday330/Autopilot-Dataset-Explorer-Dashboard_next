import { NextResponse } from "next/server";
import { supabaseServer } from "@lib/supabaseServer";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    const { data: dsData, error: dsError } = await supabaseServer
      .from("datasets")
      .select("id,name,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (dsError) throw dsError;

    const countsMap: Record<string, number> = {};
    const dsList =
      dsData?.map((d) => ({
        id: d.id,
        name: d.name,
        created_at: d.created_at,
      })) ?? [];

    for (const d of dsList) {
      const { count, error } = await supabaseServer
        .from("images")
        .select("id", { count: "exact", head: true })
        .eq("dataset_id", d.id);

      countsMap[d.id] = error ? 0 : count ?? 0;
    }

    return NextResponse.json({ datasets: dsList, counts: countsMap });
  } catch (err: any) {
    return NextResponse.json(
      { datasets: [], counts: {}, error: err.message },
      { status: 500 }
    );
  }
}
