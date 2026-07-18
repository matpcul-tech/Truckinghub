import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildInvoicePacket, formatInvoiceNumber } from "@/lib/invoice";

interface DocumentRow {
  id: string;
  url: string;
  created_at: string;
}

async function downloadFromStorage(
  supabase: ReturnType<typeof createClient>,
  path: string
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const { data, error } = await supabase.storage
    .from("carrier-docs")
    .download(path);

  if (error || !data) {
    return null;
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    bytes: new Uint8Array(arrayBuffer),
    contentType: data.type || "application/octet-stream",
  };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: load, error: loadError } = await supabase
    .from("loads")
    .select("*, carriers(company_name, mc_number, invoice_seq), brokers(name)")
    .eq("id", params.id)
    .single();

  if (loadError || !load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  if (load.status !== "delivered") {
    return NextResponse.json(
      { error: "Only delivered loads can be invoiced" },
      { status: 400 }
    );
  }

  const carrier = load.carriers as {
    company_name: string;
    mc_number: string | null;
    invoice_seq: number;
  } | null;

  if (!carrier) {
    return NextResponse.json({ error: "Carrier not found" }, { status: 400 });
  }

  const nextSeq = (carrier.invoice_seq || 0) + 1;
  const invoiceNumber = formatInvoiceNumber(carrier.company_name, nextSeq);
  const invoiceDate = new Date().toISOString().split("T")[0];

  let rateconBytes: Uint8Array | null = null;
  if (load.ratecon_url) {
    const ratecon = await downloadFromStorage(supabase, load.ratecon_url);
    rateconBytes = ratecon?.bytes || null;
  }

  const { data: podDocuments } = await supabase
    .from("documents")
    .select("*")
    .eq("load_id", params.id)
    .eq("kind", "pod")
    .order("created_at", { ascending: true });

  const podFiles: { bytes: Uint8Array; contentType: string }[] = [];
  for (const doc of (podDocuments as DocumentRow[]) || []) {
    const downloaded = await downloadFromStorage(supabase, doc.url);
    if (downloaded) {
      podFiles.push(downloaded);
    }
  }

  const packetBytes = await buildInvoicePacket({
    invoiceNumber,
    invoiceDate,
    carrier: {
      company_name: carrier.company_name,
      mc_number: carrier.mc_number,
    },
    brokerName: (load.brokers as { name: string } | null)?.name || "Broker",
    load: {
      id: load.id,
      origin_city: load.origin_city,
      origin_state: load.origin_state,
      dest_city: load.dest_city,
      dest_state: load.dest_state,
      pickup_date: load.pickup_date,
      delivery_date: load.delivery_date,
      rate: load.rate,
    },
    rateconBytes,
    podFiles,
  });

  const path = `${load.carrier_id}/invoice-${invoiceNumber}-${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("carrier-docs")
    .upload(path, packetBytes, { contentType: "application/pdf" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: seqError } = await supabase
    .from("carriers")
    .update({ invoice_seq: nextSeq })
    .eq("id", load.carrier_id);

  if (seqError) {
    return NextResponse.json({ error: seqError.message }, { status: 500 });
  }

  const { error: docError } = await supabase.from("documents").insert({
    carrier_id: load.carrier_id,
    load_id: load.id,
    kind: "invoice",
    url: path,
  });

  if (docError) {
    return NextResponse.json({ error: docError.message }, { status: 500 });
  }

  const { error: statusError } = await supabase
    .from("loads")
    .update({ status: "invoiced" })
    .eq("id", load.id);

  if (statusError) {
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }

  const { data: signedUrlData } = await supabase.storage
    .from("carrier-docs")
    .createSignedUrl(path, 60 * 60 * 24);

  return NextResponse.json({
    invoiceNumber,
    path,
    signedUrl: signedUrlData?.signedUrl || null,
  });
}
