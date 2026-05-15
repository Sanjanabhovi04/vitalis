"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { MessageCircle, Smartphone, Copy, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { t, type UILang } from "@/lib/triageLocale";
import { getStoredUILang } from "@/lib/uiLang";
import { loadLastTriage } from "@/lib/triagePersistence";
import {
  buildShareText,
  buildSmsHref,
  normalizeIndiaMobileDigits,
} from "@/lib/shareReport";

type WAStatus = "idle" | "sending_consent" | "waiting_consent" | "sent" | "rejected" | "error";

export default function ShareReportPanel() {
  const [lang, setLang] = useState<UILang>(() => getStoredUILang());
  const [phone, setPhone] = useState("6361258145");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [waStatus, setWaStatus] = useState<WAStatus>("idle");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onLang = (e: Event) => {
      const ce = e as CustomEvent<{ lang?: UILang }>;
      if (ce.detail?.lang === "en" || ce.detail?.lang === "hi" || ce.detail?.lang === "kn") {
        setLang(ce.detail.lang);
      }
    };
    window.addEventListener("v-ui-lang", onLang);
    return () => window.removeEventListener("v-ui-lang", onLang);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const d = t(lang);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const prepareShare = useCallback(async () => {
    if (!loadLastTriage()) {
      showToast(d.shareNoReport);
      return null;
    }
    setBusy(true);
    try {
      const text = await buildShareText(lang);
      return text;
    } finally {
      setBusy(false);
    }
  }, [d.shareNoReport, lang, showToast]);

  const onWhatsApp = async () => {
    const msisdn = normalizeIndiaMobileDigits(phone);
    if (!msisdn) {
      showToast(d.shareInvalid);
      return;
    }
    const text = await prepareShare();
    if (!text) return;
    
    setWaStatus("sending_consent");
    
    try {
      const res = await fetch("/api/whatsapp/send-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: msisdn, reportText: text })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "API failed");
      }
      
      setWaStatus("waiting_consent");
      
      // Start polling
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/whatsapp/status?phone=${msisdn}`);
          if (statusRes.ok) {
            const data = await statusRes.json();
            if (data.status === "approved") {
              setWaStatus("sent");
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            } else if (data.status === "rejected") {
              setWaStatus("rejected");
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);
      
    } catch (e: any) {
      console.error(e);
      setWaStatus("error");
      showToast(e.message || "Failed to initiate WhatsApp flow.");
    }
  };

  const onCopy = async () => {
    const text = await prepareShare();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast(d.shareCopied);
    } catch {
      showToast(d.shareCopyFail);
    }
  };

  const smsHref = async (): Promise<string | null> => {
    const msisdn = normalizeIndiaMobileDigits(phone);
    if (!msisdn) {
      showToast(d.shareInvalid);
      return null;
    }
    const text = await prepareShare();
    if (!text) return null;
    return buildSmsHref(msisdn, text);
  };

  return (
    <div className="glass rounded-[32px] p-8 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-v-cyan/5 blur-3xl rounded-full pointer-events-none" />
      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">{d.shareTitle}</h3>
      <p className="text-xs text-v-muted font-light leading-relaxed mb-6 max-w-xl">{d.shareSubtitle}</p>

      <label className="text-[9px] font-mono text-v-muted uppercase block mb-1.5">{d.sharePhoneLabel}</label>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={d.sharePhonePlaceholder}
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          setWaStatus("idle"); // Reset status on typing
        }}
        className="w-full max-w-md bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm mb-2 font-mono"
      />
      <p className="text-[10px] text-v-muted/80 mb-6">{d.sharePhoneHint}</p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            disabled={busy || waStatus === "sending_consent" || waStatus === "waiting_consent"}
            onClick={() => void onWhatsApp()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-wider disabled:opacity-50"
          >
            {busy || waStatus === "sending_consent" ? <Loader2 className="animate-spin" size={18} /> : <MessageCircle size={18} />}
            {d.shareWhatsApp}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              const href = await smsHref();
              if (href) window.location.href = href;
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/15 hover:border-v-cyan/40 text-xs font-mono uppercase tracking-wider text-v-text disabled:opacity-50"
          >
            <Smartphone size={18} className="text-v-cyan" />
            {d.shareSms}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => void onCopy()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/15 hover:border-v-emerald/40 text-xs font-mono uppercase tracking-wider text-v-muted disabled:opacity-50"
          >
            <Copy size={18} />
            {d.shareCopyText}
          </button>
        </div>

        {/* WhatsApp Status UI */}
        {waStatus === "waiting_consent" && (
          <div className="flex items-center gap-2 text-v-cyan text-[11px] font-mono animate-pulse">
            <Loader2 className="animate-spin w-4 h-4" />
            Permission request sent. Waiting for user confirmation...
          </div>
        )}
        {waStatus === "sent" && (
          <div className="flex items-center gap-2 text-v-emerald text-[11px] font-mono">
            <CheckCircle2 className="w-4 h-4" />
            Report sent successfully!
          </div>
        )}
        {waStatus === "rejected" && (
          <div className="flex items-center gap-2 text-v-red text-[11px] font-mono">
            <XCircle className="w-4 h-4" />
            User rejected the request. Report not sent.
          </div>
        )}
      </div>

      <p className="text-[10px] text-v-muted/70 mt-6 leading-relaxed">{d.shareNote}</p>

      {busy && waStatus === "idle" && (
        <p className="text-[10px] text-v-cyan mt-3 font-mono uppercase tracking-widest">{d.shareBuildWait}</p>
      )}
      {toast && (
        <p className="text-[11px] text-v-emerald mt-3 font-mono" role="status">
          {toast}
        </p>
      )}
    </div>
  );
}
