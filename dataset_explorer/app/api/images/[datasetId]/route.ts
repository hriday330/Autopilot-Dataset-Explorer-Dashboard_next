import { NextResponse } from "next/server";
import { supabaseServer } from "@lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { datasetId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? "1");
    const perPage = Number(searchParams.get("perPage") ?? "12");

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const datasetId = params.datasetId;

    const { data, error, count } = await supabaseServer
      .from("images")
      .select("id,storage_path,created_at", { count: "exact" })
      .eq("dataset_id", datasetId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    if (!data) {
      return NextResponse.json({
        thumbnails: [],
        total: count ?? 0,
      });
    }

    // Create signed URLs
    const thumbnails = [];

    for (const img of data) {
      try {
        const signed = await supabaseServer.storage
          .from("datasets")
          .createSignedUrl(img.storage_path, 3600);

        const url =
          signed?.data?.signedUrl ?? "";

        thumbnails.push({
          id: img.id,
          url,
          storage_path: img.storage_path,
        });
      } catch {
        thumbnails.push({
          id: img.id,
          url: "",
          storage_path: img.storage_path,
        });
      }
    }

    return NextResponse.json({
      thumbnails,
      total: count ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
