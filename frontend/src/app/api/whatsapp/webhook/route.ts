import { NextResponse } from "next/server";
import { getWhatsAppRecord, upsertWhatsAppRecord } from "@/lib/whatsappStore";
import { sendTwilioMessage } from "@/lib/twilioClient";

export async function POST(req: Request) {
  try {
    // Twilio sends data as form-urlencoded
    const text = await req.text();
    const params = new URLSearchParams(text);
    
    const from = params.get("From"); // e.g. "whatsapp:+1234567890"
    const body = params.get("Body")?.trim().toLowerCase(); // e.g. "yes"

    if (!from || !body) {
      return new NextResponse("OK");
    }

    // Extract phone digits without "whatsapp:+"
    const phone = from.replace("whatsapp:+", "");
    
    const record = getWhatsAppRecord(phone);
    
    if (record && record.status === "pending") {
      if (body === "yes" || body === "y") {
        // Update status to approved
        upsertWhatsAppRecord(phone, "approved", record.reportText);
        
        // Send the actual report
        await sendTwilioMessage(phone, record.reportText);
      } else if (body === "no" || body === "n") {
        // User rejected
        upsertWhatsAppRecord(phone, "rejected", record.reportText);
      }
    }

    // Return an empty TwiML response to Twilio so it doesn't log a warning
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new NextResponse(twiml, { 
      status: 200,
      headers: { "Content-Type": "text/xml" }
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
