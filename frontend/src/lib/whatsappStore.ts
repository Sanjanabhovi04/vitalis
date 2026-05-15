import fs from "fs";
import path from "path";

export type ConsentStatus = "pending" | "approved" | "rejected";

export type WhatsAppRecord = {
  phone: string;
  status: ConsentStatus;
  reportText: string;
  updatedAt: string;
};

type Store = { requests: WhatsAppRecord[] };

const DATA_DIR = path.join(process.cwd(), "data");
const WHATSAPP_FILE = path.join(DATA_DIR, "whatsapp.json");

function readStore(): Store {
  try {
    const raw = fs.readFileSync(WHATSAPP_FILE, "utf-8");
    const data = JSON.parse(raw) as Store;
    if (!data || !Array.isArray(data.requests)) return { requests: [] };
    return data;
  } catch {
    return { requests: [] };
  }
}

function writeStore(store: Store): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(WHATSAPP_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write whatsapp store", err);
  }
}

export function getWhatsAppRecord(phone: string): WhatsAppRecord | undefined {
  const p = phone.trim();
  return readStore().requests.find((r) => r.phone === p);
}

export function upsertWhatsAppRecord(phone: string, status: ConsentStatus, reportText: string): WhatsAppRecord {
  const store = readStore();
  const p = phone.trim();
  
  const existing = store.requests.find((r) => r.phone === p);
  const now = new Date().toISOString();
  
  if (existing) {
    existing.status = status;
    if (reportText) existing.reportText = reportText;
    existing.updatedAt = now;
    writeStore(store);
    return existing;
  }
  
  const record: WhatsAppRecord = { phone: p, status, reportText, updatedAt: now };
  store.requests.push(record);
  writeStore(store);
  return record;
}
