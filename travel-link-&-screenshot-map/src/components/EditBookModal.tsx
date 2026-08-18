import React, { useState, useEffect } from "react";
import { BookOpen, X, Trash2 } from "lucide-react";
import { BookItem } from "../types";
import { ItalianFlagBadge, WorldGlobeBadge } from "./BookBadges";

interface EditBookModalProps {
  isOpen: boolean;
  book: BookItem | null;
  onClose: () => void;
  onUpdateBook: (updated: BookItem) => void;
  onDeleteBook?: (id: string) => void;
}

export default function EditBookModal({
  isOpen,
  book,
  onClose,
  onUpdateBook,
  onDeleteBook,
}: EditBookModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<"italian" | "international">("italian");
  const [read, setRead] = useState(false);
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (book) {
      setTitle(book.title || "");
      setAuthor(book.author || "");
      setDescription(book.description || "");
      setLanguage(book.language || "italian");
      setRead(!!book.read);
      setNotes(book.notes || "");
      setLink(book.link || "");
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onUpdateBook({
      ...book,
      title: title.trim(),
      author: author.trim() || "Autore non specificato",
      description: description.trim(),
      language,
      read,
      notes: notes.trim() || undefined,
      link: link.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#FAF6F4] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-white/40 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 pb-3 flex justify-between items-center border-b border-orange-100 bg-white/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#d64b38]" />
            Modifica Libro
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">
              Titolo del libro *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-[#d64b38] outline-none"
            />
          </div>

          {/* Author */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">
              Autore
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-[#d64b38] outline-none"
            />
          </div>

          {/* Language Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">
              Categoria Lingua
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage("italian")}
                className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                  language === "italian"
                    ? "bg-white border-[#78a964] shadow-md ring-2 ring-[#78a964]/20"
                    : "bg-white/60 border-slate-200 hover:bg-white"
                }`}
              >
                <ItalianFlagBadge className="w-9 h-9" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800">In Italiano</span>
                  <span className="text-[10px] text-slate-500">Letteratura IT</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLanguage("international")}
                className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                  language === "international"
                    ? "bg-white border-[#4fa1e2] shadow-md ring-2 ring-[#4fa1e2]/20"
                    : "bg-white/60 border-slate-200 hover:bg-white"
                }`}
              >
                <WorldGlobeBadge className="w-9 h-9" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800">Internazionale</span>
                  <span className="text-[10px] text-slate-500">Mondo / Tradotto</span>
                </div>
              </button>
            </div>
          </div>

          {/* Status Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">
              Stato
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRead(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  !read
                    ? "bg-[#d64b38] text-white border-[#d64b38] shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                📖 Da leggere
              </button>
              <button
                type="button"
                onClick={() => setRead(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  read
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                ✓ Già letto
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">
              Descrizione o Trama
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs leading-relaxed focus:ring-2 focus:ring-[#d64b38] outline-none resize-none"
            />
          </div>

          {/* Link */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
              Link opzionale
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-[#d64b38] outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-orange-100">
            {onDeleteBook && (
              <button
                type="button"
                onClick={() => {
                  onDeleteBook(book.id);
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Elimina libro"
              >
                <Trash2 className="w-4 h-4" />
                Elimina
              </button>
            )}

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#d64b38] hover:bg-[#c0402e] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
