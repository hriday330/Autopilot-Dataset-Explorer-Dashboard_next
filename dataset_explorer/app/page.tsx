import { cookies } from "next/headers";
import { supabaseServer } from "@lib/supabaseServer";
import { DashboardContent } from "./DashboardContent";
import { redirect } from "next/navigation";
import { getDatasetsForUser } from "@lib/server/db/getDatasetsForUser";
import { getThumbnails } from "@lib/server/db/getThumbnails";
import { getLabels } from "@lib/server/db/getLabels";
import { createSupabaseServerClient } from "@lib/server/supabaseClient";

export default async function Page() {
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login')
  }

  const selectedFromCookie = cookieStore.get("selectedDatasetId")?.value;

  const { data: datasets } = await getDatasetsForUser(user.id)

  let datasetId = selectedFromCookie;
  if (!datasetId || !datasets?.some((d) => d.id === datasetId)) {
    datasetId = datasets?.[0]?.id ?? null;
  }

  const { data: thumbs, count } = await getThumbnails(datasetId, 1, 12);

  const { data: labels } = await getLabels(datasetId);

  return (
    <DashboardContent
      initialUser={user}
      initialDatasets={datasets}
      initialDatasetId={datasetId}
      initialThumbnails={thumbs}
      initialTotal={count}
      initialLabels={labels}
    />
  );
}
