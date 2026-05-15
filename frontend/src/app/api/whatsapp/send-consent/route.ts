import { NextResponse } from "next/server";
import { upsertWhatsAppRecord } from "@/lib/whatsappStore";
import { sendTwilioMessage } from "@/lib/twilioClient";

export async function POST(req: Request) {
  try {
    const { phone, reportText } = await req.json();

    if (!phone || !reportText) {
      console.warn("[API send-consent] Missing phone or reportText");
      return NextResponse.json({ error: "Missing phone or reportText" }, { status: 400 });
    }

    console.log(`\n[API send-consent] Received request for phone: ${phone}`);

    // Save state as pending
    upsertWhatsAppRecord(phone, "pending", reportText);
    console.log(`[API send-consent] Saved pending state for ${phone}`);

    // Send consent message
    const consentMessage = "Is this your number? Can VITALIS access and send your medical report? Reply YES to continue.";
    await sendTwilioMessage(phone, consentMessage);
    
    console.log(`[API send-consent] Successfully queued consent request for ${phone}`);
    return NextResponse.json({ ok: true, status: "pending" });
  } catch (error: any) {
    console.error("\n[API send-consent] Caught exception in route:");
    console.error(error);
    return NextResponse.json(
      { error: error?.message || "Failed to send consent request" }, 
      { status: 500 }
    );
  }
}
