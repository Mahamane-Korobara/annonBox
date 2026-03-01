import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Clock, Forward, Trash2 } from "lucide-react";

/**
 * Formate la date en "Il y a X min / heures / jours / Hier"
 */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "Hier";
  return `Il y a ${Math.floor(diff / 86400)}j`;
}

export default function MessageCard({
  message,
  onMarkAsRead,
  onDelete,
  onShare,
  onGenerateCard,
  disabled,
}) {
  const isUnread = message.status === "unread";
  const date     = timeAgo(message.meta?.created_at);

  return (
    <div
      className={`relative bg-white dark:bg-surface-dark rounded-2xl shadow-sm border overflow-hidden w-72 flex flex-col gap-3 p-4 transition-all ${
        isUnread
          ? "border-l-4 border-l-red-500 border-t border-r border-b border-gray-200 dark:border-gray-700"
          : "border border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* ── Header : statut + date ── */}
      <div className="flex items-center justify-between">
        <span
          className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${
            isUnread ? "text-red-500" : "text-text-muted-light"
          }`}
        >
          {isUnread && (
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          )}
          {isUnread ? "Nouveau" : "Lu"}
        </span>

        <span className="flex items-center gap-1 text-xs text-text-muted-light">
          <Clock size={11} />
          {date}
        </span>
      </div>

      {/* ── Contenu ── */}
      <p className="text-sm font-extrabold leading-snug flex-1">
        "{message.anonymous_content}"
      </p>

      {/* Réponse si existante */}
      {message.response_content && (
        <p className="text-xs text-text-muted-light italic border-l-2 border-primary pl-3">
          {message.response_content}
        </p>
      )}

      {/* ── Footer : actions ── */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700/50">
        {/* Marquer comme lu / déjà lu */}
        <button
          onClick={!isUnread ? undefined : onMarkAsRead}
          disabled={disabled || !isUnread}
          className={`flex items-center gap-1.5 text-xs font-bold transition ${
            isUnread
              ? "text-text-muted-light hover:text-primary cursor-pointer"
              : "text-green-500 cursor-default"
          }`}
        >
          <CheckCircle2 size={14} />
          {isUnread ? "Lu" : "Marqué comme lu"}
        </button>

        {/* Actions droite */}
        <div className="flex items-center gap-3">
          {/* Partager / générer carte */}
          <button
            onClick={onShare}
            disabled={disabled}
            className="text-text-muted-light hover:text-primary transition"
            title="Partager"
          >
            <Forward size={14} />
          </button>

          {/* Supprimer */}
          <button
            onClick={onDelete}
            disabled={disabled}
            className="text-text-muted-light hover:text-red-500 transition"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}