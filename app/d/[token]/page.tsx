import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DriverLoadView from "@/components/driver/driver-load-view";

export default async function DriverLoadPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_load_by_driver_token", {
    token: params.token,
  });

  if (error || !data || data.length === 0) {
    notFound();
  }

  return <DriverLoadView token={params.token} initialLoad={data[0]} />;
}
