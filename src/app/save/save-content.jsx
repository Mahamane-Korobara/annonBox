"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import { ROUTES, TIMEOUTS } from "@/lib/utils/constants";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function Icon({ name, className }) {
  return <span className={cn("material-symbols-outlined", className)}>{name}</span>;
}

export default function SavePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const token  = searchParams.get("token");
  const handle = searchParams.get("handle");

  const origin   = typeof window !== "undefined" ? window.location.origin : "https://anonbox.com";
  const inboxUrl = token ? `${origin}${ROUTES.INBOX(token)}` : null;

  // Guard : pas de token → retour à l'accueil
  useEffect(() => {
    if (!token) router.replace(ROUTES.HOME);
  }, [token, router]);

  if (!token) return null;

  const handleCopy = () => {
    if (!inboxUrl) return;
    navigator.clipboard.writeText(inboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), TIMEOUTS.COPY_FEEDBACK);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        body { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="min-h-screen flex flex-col bg-[#f1f2f6] dark:bg-[#0f1115] text-[#1e272e] dark:text-[#dfe4ea] transition-colors duration-200 overflow-x-hidden">

        <AppHeader variant="save" />

        {/* MAIN */}
        <main className="grow flex items-center justify-center py-12 px-4 sm:px-6">
          <div className="max-w-3xl w-full space-y-8">

            {/* Titre */}
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-bold mb-2">
                <Icon name="check_circle" className="text-lg" />
                Inbox créée avec succès !
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#1e272e] dark:text-white">
                Sauvegardez vos accès
              </h1>
              {handle && (
                <p className="text-sm font-semibold text-[#57606f] dark:text-[#a4b0be]">
                  Bienvenue, <span className="text-[#ff4757]">@{handle}</span> 👋
                </p>
              )}
              <p className="text-lg text-[#57606f] dark:text-[#a4b0be] max-w-2xl mx-auto">
                Voici votre lien unique. La sécurité est notre priorité : nous ne stockons
                pas d'email, vous êtes donc le seul responsable de votre clé d'administration.
              </p>
            </div>

            {/* Card */}
            <div className="flex justify-center">
              <div className="bg-white dark:bg-[#1e2126] rounded-2xl p-6 sm:p-8 shadow-xl shadow-red-200/50 dark:shadow-none border-2 border-red-100 dark:border-red-900/30 flex flex-col gap-6 relative overflow-hidden ring-4 ring-red-50 dark:ring-red-900/10 w-full max-w-xl">

                <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] pointer-events-none">
                  <Icon name="lock_person" className="text-[12rem] text-red-500" />
                </div>

                {/* En-tête carte */}
                <div className="flex items-center gap-4 border-b border-red-50 dark:border-red-900/30 pb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                    <Icon name="admin_panel_settings" className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Lien Privé (ADMIN)</h3>
                    <p className="text-sm text-[#57606f] dark:text-[#a4b0be]">Votre accès personnel</p>
                  </div>
                </div>

                {/* Bannière d'alerte */}
                <div className="bg-red-600 text-white p-5 rounded-xl relative z-10 shadow-lg shadow-red-500/20">
                  <div className="flex gap-4 items-start">
                    <div className="bg-white/20 p-2 rounded-lg shrink-0">
                      <Icon name="warning" className="text-2xl" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black uppercase tracking-tight text-sm sm:text-base">
                        SAUVEGARDEZ CE LIEN MAINTENANT !
                      </h4>
                      <p className="text-sm font-medium opacity-90 leading-relaxed">
                        Il ne peut pas être récupéré si vous le perdez. C'est votre{" "}
                        <u>seule clé d'accès</u> à vos messages.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Champ lien secret */}
                <div className="space-y-2 relative z-10">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#57606f] dark:text-[#a4b0be]">
                    Lien secret
                  </label>
                  <div
                    onClick={handleCopy}
                    className="bg-[#f1f2f6] dark:bg-black/20 p-4 rounded-xl border border-red-200 dark:border-red-900/50 flex items-center justify-between gap-3 group hover:border-red-400 transition-colors cursor-pointer"
                  >
                    <code className="text-sm font-mono truncate text-[#1e272e] dark:text-gray-300 select-all w-full">
                      {inboxUrl}
                    </code>
                    <button
                      className="text-[#57606f] group-hover:text-red-500 transition-colors shrink-0"
                      title="Copier"
                      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                    >
                      <Icon name="content_copy" />
                    </button>
                  </div>
                </div>

                {/* Bouton copier */}
                <div className="mt-auto relative z-10 pt-4">
                  <Button
                    onClick={handleCopy}
                    className="w-full py-3.5 h-auto rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 !text-red-700! dark:!text-red-300! font-bold border border-red-100 dark:border-transparent"
                    variant="ghost"
                  >
                    <Icon name={copied ? "check" : "content_copy"} className="text-sm" />
                    {copied ? "Copié !" : "Copier le lien"}
                  </Button>
                </div>
              </div>
            </div>

            {/* CTA → inbox */}
            <div className="flex justify-center pt-8 sm:pt-12">
              <Button
                asChild
                className="h-16 px-10 sm:px-14 rounded-full bg-[#ff4757] hover:bg-[#ff6b81] !text-white! text-lg sm:text-xl font-bold shadow-xl shadow-[#ff4757]/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                <Link href={ROUTES.INBOX(token)}>
                  Accéder à mon inbox
                  <Icon name="arrow_forward" />
                </Link>
              </Button>
            </div>

          </div>
        </main>

        <AppFooter variant="minimal" />

      </div>
    </>
  );
}
