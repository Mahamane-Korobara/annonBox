"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useInbox, useMessageActions } from "@/lib/hooks/useMessages";
import { usePrompts } from "@/lib/hooks/usePrompts";
import { SharePromptCard } from "@/components/promt/SharePromptCard";
import SidebarPanel from "@/components/layout/SidebarPanel";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import MessageCard from "@/components/shared/MessageCard";
import { Loader2, ChevronUp, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MESSAGE_STATUS, ROUTES, TIMEOUTS } from "@/lib/utils/constants";

export default function DashboardPage() {
  const { token } = useParams();
  const router    = useRouter();
  const { user, verifySession, isLoading: authLoading } = useAuth();

  const [pageReady, setPageReady]           = useState(false);
  const [isScrolled, setIsScrolled]         = useState(false);
  const [activeTab, setActiveTab]           = useState(MESSAGE_STATUS.ALL);
  const [promptInput, setPromptInput]       = useState("");
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [sharePromptId, setSharePromptId]   = useState(null);
  const [copiedLink, setCopiedLink]         = useState(false);
  const [showShareCard, setShowShareCard]   = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  // ── Fix hydration ────────────────────────────────────────────────────────
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

  // ── Hooks ────────────────────────────────────────────────────────────────
  const {
    messages, unreadCount, totalCount,
    loading: inboxLoading, error: inboxError,
    loadInbox, loadUnread,
  } = useInbox();

  const {
    prompts, loading: promptsLoading, error: promptsError,
    loadPrompts, addPrompt, removePrompt, sharePrompt,
    randomQuestion, pickRandomQuestion,
  } = usePrompts(user?.handle);

  // Synchro question aléatoire → textarea uniquement si le formulaire est ouvert
  const showPromptFormRef = useRef(showPromptForm);
  useEffect(() => { showPromptFormRef.current = showPromptForm; }, [showPromptForm]);
  useEffect(() => {
    if (randomQuestion && showPromptFormRef.current) setPromptInput(randomQuestion);
  }, [randomQuestion]);

  // Sélectionner le premier prompt par défaut
  useEffect(() => {
    if (prompts.length > 0 && !sharePromptId) setSharePromptId(prompts[0].id);
  }, [prompts]); // eslint-disable-line

  const refreshInbox = useCallback(() => {
    if (activeTab === MESSAGE_STATUS.UNREAD) loadUnread(); else loadInbox();
  }, [activeTab, loadInbox, loadUnread]);

  const {
    markAsRead, remove, share, generateCard,
    loading: actionLoading, error: actionError,
  } = useMessageActions(refreshInbox);

  // ── Auth + init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { router.replace(ROUTES.HOME); return; }
    verifySession(token).then(() => setPageReady(true)).catch(() => {});
  }, [token]); // eslint-disable-line

  useEffect(() => {
    if (pageReady) { loadInbox(); loadPrompts(); }
  }, [pageReady]); // eslint-disable-line

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === MESSAGE_STATUS.UNREAD) loadUnread(); else loadInbox();
  };

  const handleAddPrompt = async () => {
    if (!promptInput.trim()) return;
    const created = await addPrompt(promptInput);
    flushSync(() => { setPromptInput(""); setShowPromptForm(false); });
    if (created?.id) setSharePromptId(created.id);
  };

  const handleOpenShareCard = () => {
    if (selectedPrompt) sharePrompt(selectedPrompt.id);
    setShowShareCard(true);
  };

  const handleSocialShare = () => {
    if (selectedPrompt) sharePrompt(selectedPrompt.id);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), TIMEOUTS.COPY_FEEDBACK);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!pageReady || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4 text-text-muted-light">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="font-semibold">Vérification de votre accès…</p>
        </div>
      </div>
    );
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const publicLink     = `${origin}${ROUTES.PUBLIC_PROFILE(user?.handle ?? "")}`;
  const selectedPrompt = prompts.find((p) => p.id === sharePromptId);
  const shareLink      = selectedPrompt?.share_url ?? publicLink;
  const whatsappText   = selectedPrompt
    ? `Réponds à ma question anonymement :\n"${selectedPrompt.question_text}"\n👉 ${shareLink}`
    : `Envoie-moi un message anonyme 👉 ${shareLink}`;

  // Props communes pour SidebarPanel
  const sidebarProps = {
    stats: { totalCount, unreadCount },
    prompts,
    promptsLoading,
    promptsError,
    promptInput,
    setPromptInput,
    showPromptForm,
    setShowPromptForm,
    sharePromptId,
    setSharePromptId,
    selectedPrompt,
    copiedLink,
    shareLink,
    whatsappText,
    userHandle: user?.handle,
    onAddPrompt: handleAddPrompt,
    onRemovePrompt: removePrompt,
    onCopyLink: copyShareLink,
    onSocialShare: handleSocialShare,
    onPickRandom: pickRandomQuestion,
    onOpenShareCard: handleOpenShareCard,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">

      {/* Modal carte partage question */}
      {showShareCard && (
        <SharePromptCard
          prompt={selectedPrompt}
          publicLink={publicLink}
          userHandle={user?.handle}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Modal carte partage message */}
      {selectedMessage && (
        <SharePromptCard
          message={selectedMessage}
          publicLink={publicLink}
          userHandle={user?.handle}
          onClose={() => setSelectedMessage(null)}
        />
      )}

      <AppHeader
        variant="dashboard"
        withShadow={isScrolled}
        rightSlot={(
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm font-semibold text-text-muted-light hidden sm:block">
                @{user.handle}
              </span>
            )}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition"
            >
              <Menu size={14} />
              Partager
            </button>
          </div>
        )}
      />

      {/* ── PANNEAU MOBILE ── */}
      {sidebarOpen && (
        <div className="lg:hidden w-full bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-base">Partager & Stats</p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-text-muted-light hover:text-primary transition"
              >
                <ChevronUp size={14} />
              </button>
            </div>
            <SidebarPanel {...sidebarProps} />
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── SIDEBAR desktop ── */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="sticky top-24 space-y-4">
              <div>
                <h1 className="text-2xl font-black mb-1">Mon Inbox</h1>
                <p className="text-sm text-text-muted-light">
                  Bonjour{user?.display_name ? `, ${user.display_name}` : ""} 👋{" "}
                  <span>Gérez vos messages</span>
                </p>
              </div>
              <SidebarPanel {...sidebarProps} />
            </div>
          </aside>

          {/* ── MESSAGES ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* En-tête mobile */}
            <div className="lg:hidden flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black">Mon Inbox</h1>
                <p className="text-xs text-text-muted-light mt-0.5">
                  Bonjour{user?.display_name ? `, ${user.display_name}` : ""} 👋
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">{totalCount}</p>
                <p className="text-xs text-text-muted-light">messages</p>
                {unreadCount > 0 && (
                  <p className="text-xs text-primary font-bold">{unreadCount} non lus</p>
                )}
              </div>
            </div>

            {/* TABS */}
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => handleTabChange(MESSAGE_STATUS.ALL)}
                className={`border-b-2 font-bold text-sm pb-2.5 transition ${
                  activeTab === MESSAGE_STATUS.ALL
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted-light"
                }`}
              >
                Tous les messages
              </button>
              <button
                onClick={() => handleTabChange(MESSAGE_STATUS.UNREAD)}
                className={`font-medium text-sm pb-2.5 border-b-2 transition ${
                  activeTab === MESSAGE_STATUS.UNREAD
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted-light"
                }`}
              >
                Non lus
                {unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary text-white text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Erreurs */}
            {(inboxError || actionError) && (
              <div className="text-sm text-red-500 font-semibold px-1">
                {inboxError || actionError}
              </div>
            )}

            {/* Messages */}
            {inboxLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted-light gap-3">
                <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="font-semibold">Aucun message pour l'instant.</p>
                <p className="text-xs">Partagez votre lien pour recevoir des messages !</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3">
                  {messages.map((msg) => (
                    <MessageCard
                      key={msg.id}
                      message={msg}
                      onMarkAsRead={() => markAsRead(msg.id)}
                      onDelete={() => remove(msg.id)}
                      onShare={() => setSelectedMessage(msg)}
                      onGenerateCard={() => setSelectedMessage(msg)}
                      disabled={actionLoading}
                    />
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    variant="mutedLink"
                    size="default"
                    className="text-sm font-bold text-text-muted-light hover:text-primary transition"
                    onClick={() => loadInbox()}
                  >
                    Charger plus de messages
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <AppFooter variant="default" />
    </div>
  );
}
