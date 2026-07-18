import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface DriverLoadRow {
  id: string;
  carrier_id: string;
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: loadRows, error: loadError } = await admin.rpc(
    "get_load_by_driver_token",
    { token: params.token }
  );

  if (loadError || !loadRows || loadRows.length === 0) {
    return NextResponse.json({ error: "Invalid driver link" }, { status: 404 });
  }

  const load = (loadRows as DriverLoadRow[])[0];
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const path = `${load.carrier_id}/pod-${Date.now()}-${file.name}`;

  const { error: uploadError } = await admin.storage
    .from("carrier-docs")
    .upload(path, buffer, { contentType: file.type || "application/octet-stream" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await admin.rpc("insert_pod_by_driver_token", {
    token: params.token,
    doc_url: path,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
