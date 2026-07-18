import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function formatInvoiceNumber(companyName: string, seq: number): string {
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 6);
  const padded = String(seq).padStart(4, "0");
  return `${initials || "INV"}-${padded}`;
}

interface InvoicePacketInput {
  invoiceNumber: string;
  invoiceDate: string;
  carrier: {
    company_name: string;
    mc_number: string | null;
  };
  brokerName: string;
  load: {
    id: string;
    origin_city: string | null;
    origin_state: string | null;
    dest_city: string | null;
    dest_state: string | null;
    pickup_date: string | null;
    delivery_date: string | null;
    rate: number;
  };
  rateconBytes: Uint8Array | null;
  podFiles: { bytes: Uint8Array; contentType: string }[];
}

export async function buildInvoicePacket(
  input: InvoicePacketInput
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]);
  const left = 50;
  let y = 740;

  function drawLine(
    text: string,
    options?: { bold?: boolean; size?: number; gap?: number }
  ) {
    const size = options?.size ?? 11;
    page.drawText(text, {
      x: left,
      y,
      size,
      font: options?.bold ? boldFont : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= options?.gap ?? size + 8;
  }

  drawLine("INVOICE", { bold: true, size: 22, gap: 34 });
  drawLine(`Invoice number: ${input.invoiceNumber}`);
  drawLine(`Date: ${input.invoiceDate}`);
  y -= 14;

  drawLine("From", { bold: true });
  drawLine(input.carrier.company_name);
  if (input.carrier.mc_number) {
    drawLine(`MC ${input.carrier.mc_number}`);
  }
  y -= 14;

  drawLine("Bill to", { bold: true });
  drawLine(input.brokerName);
  y -= 14;

  drawLine("Load detail", { bold: true });
  drawLine(
    `Lane: ${input.load.origin_city || "?"}, ${input.load.origin_state || "?"} to ${
      input.load.dest_city || "?"
    }, ${input.load.dest_state || "?"}`
  );
  drawLine(`Pickup date: ${input.load.pickup_date || "-"}`);
  drawLine(`Delivery date: ${input.load.delivery_date || "-"}`);
  drawLine(`Load reference: ${input.load.id}`);
  y -= 10;
  drawLine(`Rate due: $${Number(input.load.rate).toLocaleString()}`, {
    bold: true,
    size: 15,
  });

  if (input.rateconBytes) {
    try {
      const rateconDoc = await PDFDocument.load(input.rateconBytes, {
        ignoreEncryption: true,
      });
      const copiedPages = await pdfDoc.copyPages(
        rateconDoc,
        rateconDoc.getPageIndices()
      );
      copiedPages.forEach((copiedPage) => pdfDoc.addPage(copiedPage));
    } catch {
      // not a readable PDF, skip
    }
  }

  for (const pod of input.podFiles) {
    if (pod.contentType === "application/pdf") {
      try {
        const podDoc = await PDFDocument.load(pod.bytes, {
          ignoreEncryption: true,
        });
        const copiedPages = await pdfDoc.copyPages(
          podDoc,
          podDoc.getPageIndices()
        );
        copiedPages.forEach((copiedPage) => pdfDoc.addPage(copiedPage));
      } catch {
        // not a readable PDF, skip
      }
      continue;
    }

    try {
      const image =
        pod.contentType === "image/png"
          ? await pdfDoc.embedPng(pod.bytes)
          : await pdfDoc.embedJpg(pod.bytes);
      const podPage = pdfDoc.addPage([612, 792]);
      const maxWidth = 512;
      const maxHeight = 700;
      const scale = Math.min(
        maxWidth / image.width,
        maxHeight / image.height,
        1
      );
      const width = image.width * scale;
      const height = image.height * scale;
      podPage.drawImage(image, {
        x: (612 - width) / 2,
        y: (792 - height) / 2,
        width,
        height,
      });
    } catch {
      // unsupported image type, skip
    }
  }

  return pdfDoc.save();
}
