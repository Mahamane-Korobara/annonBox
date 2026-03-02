"use client";

/**
 * SharePromptCard.jsx
 *
 * Logique coins :
 * - Prévisualisation dans le modal → border-radius visible (joli)
 * - Export PNG → rectangle plein, pas de clip, backgroundColor blanc
 *   pour que le fond soit opaque sur toutes les apps (WhatsApp, Insta, etc.)
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { X, Download, Copy, Check } from "lucide-react";
import { API_URL, STORAGE_KEYS } from "@/lib/utils/constants";

const THEMES = [
  { id: "violet", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", text: "#ffffff", sub: "rgba(255,255,255,0.72)", badge: "rgba(255,255,255,0.18)", border: "rgba(255,255,255,0.2)" },
  { id: "coral",  bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", text: "#ffffff", sub: "rgba(255,255,255,0.72)", badge: "rgba(255,255,255,0.18)", border: "rgba(255,255,255,0.2)" },
  { id: "ocean",  bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", text: "#ffffff", sub: "rgba(255,255,255,0.75)", badge: "rgba(255,255,255,0.18)", border: "rgba(255,255,255,0.2)" },
  { id: "forest", bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", text: "#064e3b", sub: "rgba(6,78,59,0.6)",     badge: "rgba(6,78,59,0.12)",    border: "rgba(6,78,59,0.2)"   },
  { id: "sunset", bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", text: "#ffffff", sub: "rgba(255,255,255,0.75)", badge: "rgba(255,255,255,0.2)",  border: "rgba(255,255,255,0.2)" },
  { id: "dark",   bg: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", text: "#f5f3ff", sub: "rgba(245,243,255,0.55)", badge: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.25)" },
];

const SCALE = 3;

/**
 * Capture la carte en PNG rectangulaire plein (pas de clip, pas de transparence).
 * On retire temporairement le border-radius avant la capture.
 */
async function captureFlat(el) {
  const prev = el.style.borderRadius;
  el.style.borderRadius = "0";

  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(el, {
    scale: SCALE,
    useCORS: true,
    backgroundColor: "#ffffff", // fond blanc opaque → pas de coins transparents
    logging: false,
  });

  el.style.borderRadius = prev;
  return canvas;
}

function downloadCanvas(canvas, filename) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

function canvasToBlob(canvas) {
  return new Promise((res) => canvas.toBlob(res, "image/png"));
}

export function SharePromptCard({
  prompt,
  message,
  publicLink,
  userHandle,
  autoSharePlatform = null,
  onAutoShareDone,
  onClose,
}) {
  const cardRef = useRef(null);
  const shareCacheRef = useRef({ key: "", url: "" });
  const autoShareTriggeredRef = useRef(false);

  const [themeIdx, setThemeIdx] = useState(0);
  const theme = THEMES[themeIdx];

  const [copied, setCopied] = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [guide,  setGuide]  = useState(null);

  const shareLink    = prompt?.share_url ?? publicLink;
  const cardText =
    message?.anonymous_content ??
    prompt?.question_text ??
    "Envoie-moi un message anonyme !";
  const isMessage = !!message;
  const filename     = `anonbox-${userHandle ?? "question"}.png`;
  const shareCacheKey = `${theme.id}|${isMessage ? "message" : "prompt"}|${cardText}|${shareLink}`;

  useEffect(() => {
    setThemeIdx(Math.floor(Math.random() * THEMES.length));
  }, []);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const getCanvas = useCallback(() => captureFlat(cardRef.current), []);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [shareLink]);

  const buildShareText = useCallback((url) => (
    isMessage
      ? `J'ai reçu ce message anonyme 👇\n\n"${cardText}"\n\n👉 ${url}`
      : `${cardText}\n\n👉 Réponds anonymement : ${url}`
  ), [cardText, isMessage]);

  const toFrontendPublicUrl = useCallback((url) => {
    if (typeof window === "undefined") return url;
    try {
      const parsed = new URL(url);
      if (!parsed.pathname.startsWith("/u/")) return url;
      return `${window.location.origin}${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }, []);

  const createSharePage = useCallback(async () => {
    if (shareCacheRef.current.key === shareCacheKey && shareCacheRef.current.url) {
      return shareCacheRef.current.url;
    }

    const canvas = await getCanvas();
    const blob = await canvasToBlob(canvas);
    if (!blob) throw new Error("Capture image impossible");

    const targetUrl = toFrontendPublicUrl(shareLink);

    const formData = new FormData();
    formData.append("image", blob, filename);
    formData.append("cardText", cardText);
    formData.append("shareText", buildShareText(targetUrl));
    formData.append("targetUrl", targetUrl);
    formData.append("isMessage", String(isMessage));

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.PRIVATE_TOKEN)
        : null;

    const headers = { Accept: "application/json" };
    if (token) headers["X-Private-Token"] = token;

    const res = await fetch(`${API_URL}/shares`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error("Publication du lien de partage impossible");

    const payload = await res.json();
    const pageUrl =
      payload?.data?.share_page_url ??
      payload?.data?.sharePageUrl ??
      (payload?.data?.id && typeof window !== "undefined"
        ? `${window.location.origin}/share/${payload.data.id}`
        : null);
    if (!pageUrl) throw new Error("Lien de partage invalide");

    shareCacheRef.current = { key: shareCacheKey, url: pageUrl };
    return pageUrl;
  }, [
    buildShareText,
    cardText,
    filename,
    getCanvas,
    isMessage,
    shareCacheKey,
    shareLink,
    toFrontendPublicUrl,
  ]);

  const resolveShareLink = useCallback(async () => {
    try {
      const pageLink = await createSharePage();
      return { link: pageLink, hasPreviewCard: true };
    } catch (error) {
      console.error("Create share page failed:", error);
      return { link: toFrontendPublicUrl(shareLink), hasPreviewCard: false };
    }
  }, [createSharePage, shareLink, toFrontendPublicUrl]);

  const shareViaNative = useCallback(async ({ url, text }) => {
    if (!cardRef.current || typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return { status: "unsupported", canvas: null };
    }

    const canvas = await getCanvas();
    const blob = await canvasToBlob(canvas);
    if (!blob) return { status: "unsupported", canvas };

    const file = new File([blob], filename, { type: "image/png" });
    const payloads = [
      url ? { files: [file], title: "AnonBox", text, url } : null,
      text ? { files: [file], title: "AnonBox", text } : null,
      { files: [file], title: "AnonBox" },
    ].filter(Boolean);

    for (const payload of payloads) {
      try {
        if (navigator.canShare) {
          let canUsePayload = false;
          try {
            canUsePayload = navigator.canShare(payload);
          } catch {
            canUsePayload = false;
          }
          if (!canUsePayload) continue;
        }
        await navigator.share(payload);
        return { status: "shared", canvas };
      } catch (e) {
        if (e?.name === "AbortError") return { status: "aborted", canvas };
      }
    }

    return { status: "unsupported", canvas };
  }, [filename, getCanvas]);

  const shareImageOnlyViaNative = useCallback(async () => {
    if (!cardRef.current || typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return { status: "unsupported", canvas: null };
    }

    const canvas = await getCanvas();
    const blob = await canvasToBlob(canvas);
    if (!blob) return { status: "unsupported", canvas };

    const file = new File([blob], filename, { type: "image/png" });
    const payload = { files: [file], title: "AnonBox" };

    try {
      if (navigator.canShare && !navigator.canShare(payload)) {
        return { status: "unsupported", canvas };
      }
      await navigator.share(payload);
      return { status: "shared", canvas };
    } catch (e) {
      if (e?.name === "AbortError") return { status: "aborted", canvas };
      return { status: "unsupported", canvas };
    }
  }, [filename, getCanvas]);

  /* ── Télécharger ── */
  const handleDownload = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try { downloadCanvas(await getCanvas(), filename); }
    finally { setBusy(false); }
  };

  /* ── Instagram ── */
  const handleInstagram = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const { link: effectiveLink, hasPreviewCard } = await resolveShareLink();
      const nativeResult = await shareImageOnlyViaNative();
      if (nativeResult.status === "shared") {
        try {
          await navigator.clipboard.writeText(effectiveLink);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch {
          // Clipboard peut échouer selon permissions navigateur.
        }
        setGuide({
          color: "#E1306C",
          emoji: "📸",
          title: "Instagram Story",
          steps: [
            "La feuille de partage s'est ouverte avec l'image",
            "Le lien a été copié dans ton presse-papier",
            'Si besoin, ajoute un sticker "Lien" dans Instagram',
          ],
          cta: { label: "Ouvrir Instagram", href: "instagram://story-camera" },
        });
        return;
      }
      if (nativeResult.status === "aborted") return;

      const canvas = nativeResult.canvas ?? await getCanvas();
      downloadCanvas(canvas, filename);
      await navigator.clipboard.writeText(effectiveLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      setGuide({
        color: "#E1306C",
        emoji: "📸",
        title: "Instagram Story",
        steps: hasPreviewCard
          ? [
              "L'image a été téléchargée dans ta galerie",
              "Le lien de partage (avec aperçu carte) a été copié",
              "Ouvre Instagram → Nouvelle Story → sélectionne l'image",
              'Ajoute un sticker "Lien" puis colle le lien',
            ]
          : [
              "L'image a été téléchargée dans ta galerie",
              "Le lien standard a été copié",
              "La carte n'a pas pu être publiée pour l'aperçu automatique",
              'Partage possible via sticker "Lien" manuel',
            ],
        cta: { label: "Ouvrir Instagram", href: "instagram://story-camera" },
      });
    } finally { setBusy(false); }
  };

  /* ── WhatsApp ── */
  const handleWhatsApp = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const { link: effectiveLink, hasPreviewCard } = await resolveShareLink();
      const text = buildShareText(effectiveLink);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
      setGuide({
        color: "#25D366",
        emoji: "💬",
        title: "WhatsApp",
        steps: hasPreviewCard
          ? [
              "WhatsApp s'ouvre avec ton texte + lien prêt",
              "Le lien contient l'image de la carte en aperçu",
              "Envoie le message pour partager image + lien en une fois",
            ]
          : [
              "WhatsApp s'ouvre avec le texte + lien prêt",
              "La publication de la carte a échoué, donc pas d'aperçu image",
              "Vérifie l'API Laravel (route POST /api/shares) puis réessaie",
            ],
        cta: null,
      });
    } finally { setBusy(false); }
  };

  /* ── Facebook ── */
  const handleFacebook = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { link: effectiveLink, hasPreviewCard } = await resolveShareLink();

      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(effectiveLink)}&quote=${encodeURIComponent(cardText)}`,
        "_blank",
        "width=600,height=500"
      );
      setGuide({
        color: "#1877F2",
        emoji: "📘",
        title: "Facebook",
        steps: hasPreviewCard
          ? [
              "Facebook reçoit ton lien de partage AnonBox",
              "L'image de la carte s'affiche dans l'aperçu du lien",
              "Ajoute un commentaire puis publie",
            ]
          : [
              "Facebook reçoit ton lien",
              "La publication de la carte a échoué, donc pas d'aperçu image",
              "Vérifie l'API Laravel (route POST /api/shares) puis réessaie",
            ],
        cta: null,
      });
    } finally {
      setBusy(false);
    }
  };

  /* ── Partage natif ── */
  const handleNativeShare = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const { link: effectiveLink } = await resolveShareLink();

      const nativeResult = await shareViaNative({
        url: effectiveLink,
        text: buildShareText(effectiveLink),
      });
      if (nativeResult.status === "shared" || nativeResult.status === "aborted") return;

      const fallbackCanvas = nativeResult.canvas ?? await getCanvas();
      downloadCanvas(fallbackCanvas, filename);
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (!autoSharePlatform || autoShareTriggeredRef.current || busy) return;

    autoShareTriggeredRef.current = true;

    const runAutoShare = async () => {
      try {
        if (autoSharePlatform === "instagram") await handleInstagram();
        else if (autoSharePlatform === "whatsapp") await handleWhatsApp();
        else if (autoSharePlatform === "facebook") await handleFacebook();
      } finally {
        if (onAutoShareDone) onAutoShareDone();
      }
    };

    runAutoShare();
  }, [
    autoSharePlatform,
    busy,
    handleFacebook,
    handleInstagram,
    handleWhatsApp,
    onAutoShareDone,
  ]);

  useEffect(() => {
    if (!autoSharePlatform) {
      autoShareTriggeredRef.current = false;
    }
  }, [autoSharePlatform]);

  /* ────────────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Scrollbar globale stylisée (injectée une seule fois) */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(48px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* ── Scrollbar du sheet ── */
        .anonbox-sheet::-webkit-scrollbar          { width: 4px; }
        .anonbox-sheet::-webkit-scrollbar-track    { background: transparent; }
        .anonbox-sheet::-webkit-scrollbar-thumb    { background: rgba(255,255,255,0.15); border-radius: 99px; }
        .anonbox-sheet::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

        /* ── Scrollbar globale de la page ── */
        ::-webkit-scrollbar          { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track    { background: transparent; }
        ::-webkit-scrollbar-thumb    {
          background: linear-gradient(180deg, var(--color-primary, #7c3aed), var(--color-secondary, #a855f7));
          border-radius: 99px;
        }
        ::-webkit-scrollbar-thumb:hover { opacity: 0.8; }
        * { scrollbar-width: thin; scrollbar-color: #7c3aed transparent; }
      `}</style>

      <div
        className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Sheet */}
        <div
          className="anonbox-sheet w-full sm:max-w-md bg-[#111] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95dvh] overflow-y-auto"
          style={{ animation: "slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
            <p className="text-white font-black text-base">
              {isMessage ? "Partager ce message" : "Partager ma question"}
            </p>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Carte prévisualisation (coins arrondis pour l'affichage) ── */}
          <div className="px-4 sm:px-5 pb-3 shrink-0">
            <div
              ref={cardRef}
              style={{
                background: theme.bg,
                borderRadius: "24px",   /* visible dans le modal — retiré à l'export */
                padding: "clamp(20px, 4vw, 32px) clamp(18px, 4vw, 28px) clamp(18px, 3vw, 26px)",
                position: "relative",
                overflow: "hidden",
                fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                minHeight: "clamp(190px, 42vw, 270px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Cercles décoratifs */}
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-35px", left: "-35px", width: "130px", height: "130px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

              {/* Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: theme.badge, border: `1px solid ${theme.border}`, borderRadius: "100px", padding: "5px 12px", marginBottom: "14px", width: "fit-content" }}>
                <svg width="13" height="13" fill="none" stroke={theme.text} strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span style={{ color: theme.text, fontWeight: 800, fontSize: "12px" }}>AnonBox</span>
              </div>

              {/* Question */}
              <div style={{ flex: 1 }}>
                <p style={{ color: theme.sub, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "8px" }}>
                {isMessage ? "Message reçu" : "Question du moment"}
                </p>
                <p style={{
                  color: theme.text,
                  fontSize: cardText.length > 80 ? "15px" : cardText.length > 50 ? "18px" : "21px",
                  fontWeight: 900,
                  lineHeight: 1.3,
                }}>
                  "{cardText}"
                </p>
              </div>

              {/* Footer */}
              {/* Footer */}
          {!isMessage && (
            <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: `1px solid ${theme.border}` }}>
              <p style={{ color: theme.sub, fontSize: "10px", fontWeight: 700, marginBottom: "3px" }}>
                Réponds anonymement 👇
              </p>
              <p style={{ color: theme.text, fontSize: "11px", fontWeight: 800, wordBreak: "break-all" }}>
                {shareLink.replace(/^https?:\/\//, "")}
              </p>
            </div>
          )}
            </div>
          </div>

          {/* ── Sélecteur de thème ── */}
          <div className="flex justify-center gap-3 pb-3 shrink-0">
            {THEMES.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setThemeIdx(i)}
                aria-label={t.id}
                style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: t.bg,
                  border: i === themeIdx ? "3px solid white" : "2px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  transform: i === themeIdx ? "scale(1.35)" : "scale(1)",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* ── Guide contextuel ── */}
          {guide && (
            <div
              className="mx-4 sm:mx-5 mb-3 rounded-2xl p-3.5 space-y-2 shrink-0"
              style={{ background: `${guide.color}18`, border: `1px solid ${guide.color}40` }}
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-black text-sm">{guide.emoji} {guide.title}</p>
                <button onClick={() => setGuide(null)} className="text-white/40 hover:text-white/80 transition">
                  <X size={13} />
                </button>
              </div>
              <ol className="space-y-1">
                {guide.steps.map((s, i) => (
                  <li key={i} className="text-white/70 text-xs flex gap-2">
                    <span className="font-black shrink-0" style={{ color: guide.color }}>{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              {guide.cta && (
                <a
                  href={guide.cta.href}
                  className="inline-block mt-1 text-xs font-bold px-3 py-1.5 rounded-xl text-white hover:opacity-80 transition"
                  style={{ background: guide.color }}
                >
                  {guide.cta.label}
                </a>
              )}
            </div>
          )}

          {/* ── Boutons ── */}
          <div className="px-4 sm:px-5 pb-5 sm:pb-6 space-y-2 shrink-0">

            {/* Instagram */}
            <button
              onClick={handleInstagram}
              disabled={busy}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-white font-bold text-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              <span className="flex-1 text-left">Instagram Story</span>
              <span className="text-white/60 text-xs font-normal hidden sm:inline">Image + Lien copié</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              disabled={busy}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-white font-bold text-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: "#25D366" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="flex-1 text-left">WhatsApp</span>
              <span className="text-white/70 text-xs font-normal hidden sm:inline">Image + Lien</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebook}
              disabled={busy}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-white font-bold text-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: "#1877F2" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="flex-1 text-left">Facebook</span>
              <span className="text-white/70 text-xs font-normal hidden sm:inline">Lien + Aperçu auto</span>
            </button>

            {/* Télécharger + Copier */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleDownload}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-2xl py-3 text-white/90 font-bold text-sm transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Download size={14} />
                <span>{busy ? "…" : "Télécharger"}</span>
              </button>

              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-2 rounded-2xl py-3 text-white/90 font-bold text-sm transition active:scale-[0.98]"
                style={{
                  background: copied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
                }}
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{copied ? "Copié !" : "Copier lien"}</span>
              </button>
            </div>

            {/* Partage natif (mobile) */}
            <button
              onClick={handleNativeShare}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-white/60 font-bold text-xs transition hover:text-white hover:bg-white/10 active:scale-[0.98] disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Partager via…
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
