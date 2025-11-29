import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@lib/server/supabaseClient";
import { getDatasetsForUser } from "@lib/server/db/getDatasetsForUser";
import { getThumbnails } from "@lib/server/db/getThumbnails";

import { DatasetsContent } from "./DatasetsContent"; 

export default async function Page() {
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: datasets, error: datasetsError } = await getDatasetsForUser(
    user.id
  );

  if (!datasets || datasetsError) {
    return (
      <DatasetsContent
        initialUser={user}
        initialDatasets={[]}
        initialCounts={{}}
        initialSelectedDatasetId={null}
        initialThumbnails={[]}
        initialTotal={0}
      />
    );
  }

  const cookieSelected = cookieStore.get("selectedDatasetId")?.value;

  let datasetId = cookieSelected;
  if (!datasetId || !datasets.some((d) => d.id === datasetId)) {
    datasetId = datasets[0]?.id ?? null;
  }

  const counts: Record<string, number> = {};
  for (const d of datasets) {
    counts[d.id] = d.image_count ?? 0; 
  }

  const { data: thumbs, count } =  await getThumbnails(datasetId, 1, 12)

  return (
    <DatasetsContent
      initialUser={user}
      initialDatasets={datasets}
      initialCounts={counts}
      initialSelectedDatasetId={datasetId?? null}
      initialThumbnails={thumbs}
      initialTotal={count}
    />
  );
}
