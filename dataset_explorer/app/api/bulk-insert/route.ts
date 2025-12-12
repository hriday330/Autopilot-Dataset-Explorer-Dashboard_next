import { NextResponse } from "next/server";
import { supabaseServer } from "@lib/supabaseServer";

const BATCH_SIZE = 2000;

export async function POST(req: Request) {
  try {
    const { datasetId, storagePaths } = await req.json();

    if (!datasetId || !Array.isArray(storagePaths)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const insertedIds: string[] = [];

    for (let i = 0; i < storagePaths.length; i += BATCH_SIZE) {
      const batch = storagePaths.slice(i, i + BATCH_SIZE).map((path) => ({
        dataset_id: datasetId,
        storage_path: path,
      }));

      const { data, error } = await supabaseServer
        .from("images")
        .insert(batch)
        .select("id"); 

      if (error) {
        console.error("Bulk insert error:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      insertedIds.push(...data.map((d:any) => d.id));
    }

    return NextResponse.json({
      success: true,
      count: insertedIds.length,
      insertedIds,
    });
  } catch (err: any) {
    console.error("Bulk insert route failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
