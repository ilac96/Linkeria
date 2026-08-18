import React from "react";
import { X, Bookmark, Shuffle, Trash2, Pencil, ExternalLink, CheckCircle2 } from "lucide-react";
import { BookItem } from "../types";
import { ItalianFlagBadge, WorldGlobeBadge } from "./BookBadges";
import { motion, AnimatePresence } from "motion/react";

interface BookDetailModalProps {
  isOpen: boolean;
  book: BookItem | null;
  onClose: () => void;
  onShuffleNext?: () => void;
  onToggleRead: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onEditBook?: (book: BookItem) => void;
  onDeleteBook?: (id: string) => void;
  showShuffleButton?: boolean;
}

export default function BookDetailModal({
  isOpen,
  book,
  onClose,
  onShuffleNext,
  onToggleRead,
  onToggleFavorite,
  onEditBook,
  onDeleteBook,
  showShuffleButton = true,
}: BookDetailModalProps) {
  if (!isOpen || !book) return null;

  const isItalian = book.language === "italian";
  const borderAccentColor = isItalian ? "border-[#78a964]" : "border-[#4fa1e2]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm">
          {/* Main Book Card (matching Dettaglio libro.jpg) */}
          <motion.div
            key={book.id}
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`w-full bg-[#FAF6F4] rounded-3xl p-6 shadow-2xl relative border-[3px] ${borderAccentColor} flex flex-col min-h-[320px] max-h-[80vh] overflow-y-auto`}
          >
            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-700 hover:text-slate-950 hover:bg-black/5 transition-all cursor-pointer"
              title="Chiudi"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Badge & Category indicator */}
            <div className="flex items-center gap-3 mb-4 pr-8">
              {isItalian ? (
                <ItalianFlagBadge className="w-10 h-10" />
              ) : (
                <WorldGlobeBadge className="w-10 h-10" />
              )}
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[#d64b38] uppercase tracking-wider">
                  {isItalian ? "Libro in italiano" : "Libro internazionale"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {book.read ? "✓ Già letto" : "📖 Da leggere"}
                </span>
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1 flex flex-col gap-2">
              <h3 className="text-xl font-bold text-slate-900 leading-snug">
                {book.title}
              </h3>
              {book.author && (
                <p className="text-sm font-semibold text-slate-700">
                  {book.author}
                </p>
              )}
              {book.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-line">
                  {book.description}
                </p>
              )}
              {book.notes && (
                <div className="mt-3 p-3 bg-white/70 rounded-xl border border-orange-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-0.5">Note personali:</span>
                  {book.notes}
                </div>
              )}
              {book.link && (
                <a
                  href={book.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#d64b38] hover:underline mt-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Scheda online / Link al libro
                </a>
              )}
            </div>

            {/* Bottom Controls inside card */}
            <div className="flex items-center justify-between border-t border-orange-200/60 pt-4 mt-5">
              {/* Mark as read toggle */}
              <button
                onClick={() => onToggleRead(book.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  book.read
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-[#d64b38]/10 text-[#d64b38] hover:bg-[#d64b38]/20 border border-[#d64b38]/30"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {book.read ? "Letto ✓" : "Segna come letto"}
              </button>

              <div className="flex items-center gap-2">
                {/* Edit Button */}
                {onEditBook && (
                  <button
                    onClick={() => {
                      onEditBook(book);
                      onClose();
                    }}
                    className="p-2 rounded-full text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer"
                    title="Modifica libro"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {/* Delete Button */}
                {onDeleteBook && (
                  <button
                    onClick={() => {
                      onDeleteBook(book.id);
                      onClose();
                    }}
                    className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    title="Elimina libro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Bookmark Icon Button (matching mockup) */}
                <button
                  onClick={() => onToggleFavorite ? onToggleFavorite(book.id) : onToggleRead(book.id)}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    book.favorite
                      ? "text-[#d64b38] bg-[#d64b38]/10"
                      : "text-[#d64b38] hover:bg-[#d64b38]/10"
                  }`}
                  title={book.favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                >
                  <Bookmark className={`w-6 h-6 stroke-[2.2] ${book.favorite ? "fill-[#d64b38]" : ""}`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Floating Shuffle Button Below Card (matching Dettaglio libro.jpg) */}
          {showShuffleButton && onShuffleNext && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShuffleNext}
              className="bg-[#d64b38] hover:bg-[#c0402e] text-white p-4 rounded-2xl shadow-xl border border-white/20 flex items-center justify-center cursor-pointer transition-all"
              title="Pesca un altro libro!"
            >
              <Shuffle className="w-6 h-6 stroke-[2.5]" />
            </motion.button>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
