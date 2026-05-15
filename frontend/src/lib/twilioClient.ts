export async function sendTwilioMessage(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER; // typically 'whatsapp:+14155238886'
  
  console.log(`[Twilio Client] Initiating message send to: ${to}`);

  if (!sid || !token || !from || sid === "your_account_sid_here") {
    console.error("\n=======================================================");
    console.error("[TWILIO ERROR] Missing or invalid credentials in .env.local!");
    console.error("Please add the following to your frontend/.env.local file:");
    console.error("TWILIO_ACCOUNT_SID=...");
    console.error("TWILIO_AUTH_TOKEN=...");
    console.error("TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886");
    console.error("=======================================================\n");
    
    // If we're testing without twilio, just log it to prevent crashes
    console.log(`[TWILIO SIMULATION] Would send to ${to}: ${body}\n`);
    throw new Error("Missing Twilio credentials in environment");
  }
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  
  const params = new URLSearchParams();
  // Twilio requires 'whatsapp:+<number>'
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:+${to.replace(/^\+/, '')}`;
  const formattedFrom = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  
  console.log(`[Twilio Client] Formatted To: ${formattedTo}`);
  console.log(`[Twilio Client] Formatted From: ${formattedFrom}`);
  
  params.append("To", formattedTo);
  params.append("From", formattedFrom);
  params.append("Body", body);
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.error("\n=======================================================");
      console.error("[TWILIO API ERROR] Failed to send message!");
      console.error(`Status: ${res.status} ${res.statusText}`);
      console.error(`Response details: ${err}`);
      console.error("=======================================================\n");
      throw new Error(`Twilio API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log(`[Twilio Client] Success! Message SID: ${data.sid}\n`);
  } catch (error) {
    console.error(`[Twilio Client] Exception during fetch:`, error);
    throw error;
  }
}
