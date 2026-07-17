import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PDFParse } from "pdf-parse";

const MIN_EXTRACTED_TEXT_LENGTH = 40;

const EXTRACTION_PROMPT = `You extract structured data from truck freight rate confirmation documents.

Respond with a JSON object and nothing else. No preamble, no markdown fences, no commentary.

Return exactly this shape:

{
  "broker_name": "",
  "broker_mc": "",
  "origin_city": "",
  "origin_state": "",
  "dest_city": "",
  "dest_state": "",
  "pickup_date": "",
  "delivery_date": "",
  "rate": 0,
  "loaded_miles": 0
}

Rules:
- Dates must be formatted as YYYY-MM-DD.
- rate is a number with no currency symbol or commas.
- loaded_miles is a number.
- origin_state and dest_state are two letter state codes.
- If a field is not found in the document, use an empty string for text fields or 0 for number fields.`;

function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

interface ParsedRatecon {
  broker_name: string;
  broker_mc: string;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  pickup_date: string;
  delivery_date: string;
  rate: number;
  loaded_miles: number;
}

function emptyResult(): ParsedRatecon {
  return {
    broker_name: "",
    broker_mc: "",
    origin_city: "",
    origin_state: "",
    dest_city: "",
    dest_state: "",
    pickup_date: "",
    delivery_date: "",
    rate: 0,
    loaded_miles: 0,
  };
}

function coerceResult(raw: unknown): ParsedRatecon {
  const result = emptyResult();
  if (!raw || typeof raw !== "object") {
    return result;
  }
  const source = raw as Record<string, unknown>;

  for (const key of Object.keys(result) as (keyof ParsedRatecon)[]) {
    const value = source[key];
    if (key === "rate" || key === "loaded_miles") {
      result[key] = typeof value === "number" ? value : Number(value) || 0;
    } else if (typeof value === "string") {
      result[key] = value;
    }
  }

  return result;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    return textResult.text || "";
  } finally {
    await parser.destroy();
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let extractedText = "";
  try {
    extractedText = await extractPdfText(buffer);
  } catch {
    extractedText = "";
  }

  const client = new Anthropic();
  const useTextExtraction = extractedText.trim().length >= MIN_EXTRACTED_TEXT_LENGTH;

  const userContent: Anthropic.MessageParam["content"] = useTextExtraction
    ? [
        {
          type: "text",
          text: `${EXTRACTION_PROMPT}\n\nDocument text:\n\n${extractedText}`,
        },
      ]
    : [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: buffer.toString("base64"),
          },
        },
        { type: "text", text: EXTRACTION_PROMPT },
      ];

  let response;
  try {
    response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      messages: [{ role: "user", content: userContent }],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to parse rate confirmation: ${message}` },
      { status: 502 }
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(emptyResult());
  }

  const cleaned = stripCodeFences(textBlock.text);

  try {
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(coerceResult(parsed));
  } catch {
    return NextResponse.json(emptyResult());
  }
}
