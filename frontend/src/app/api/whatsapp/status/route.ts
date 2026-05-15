import { NextResponse } from "next/server";
import { getWhatsAppRecord } from "@/lib/whatsappStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Missing phone" }, { status: 400 });
  }

  const record = getWhatsAppRecord(phone);
  
  if (!record) {
    return NextResponse.json({ status: "not_found" });
  }

  return NextResponse.json({ status: record.status });
}
