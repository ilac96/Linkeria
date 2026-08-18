import React from "react";
import { BookItem } from "../types";
import { ItalianFlagBadge, WorldGlobeBadge } from "./BookBadges";
import { Shuffle, Plus, BookOpen } from "lucide-react";
import { motion } from "motion/react";

interface BookPickSectionProps {
  toReadBooks: BookItem[];
  onPickBook: (category: "italian" | "international" | "all") => void;
  onAddNewBook: () => void;
}

export default function BookPickSection({
  toReadBooks,
  onPickBook,
  onAddNewBook,
}: BookPickSectionProps) {
  const italianCount = toReadBooks.filter((b) => b.language === "italian").length;
  const internationalCount = toReadBooks.filter((b) => b.language === "international").length;

  return (
    <div className="w-full h-full overflow-y-auto px-4 py-8 pb-32 flex flex-col items-center justify-center min-h-[500px]">
      <div className="w-full max-w-lg flex flex-col items-center text-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-[#d64b38] tracking-tight">
          Trova il prossimo libro da leggere
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm leading-relaxed">
          Scegli una delle 2 opzioni. L'app ti proporrà un libro tra quelli che hai salvato in &ldquo;Da leggere&rdquo;.
        </p>
      </div>

      {/* The 2 Stacked Card Options (matching Scegli libro.jpg) */}
      <div className="grid grid-cols-2 gap-5 sm:gap-8 w-full max-w-md px-2 my-auto">
        {/* Italian Books Deck */}
        <motion.div
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onPickBook("italian")}
          className="relative group cursor-pointer select-none"
        >
          {/* Stacked background cards effect (layered at the bottom) */}
          <div className="absolute inset-0 top-3 -bottom-3 mx-2 bg-[#FAF6F4] border-[1.5px] border-[#d64b38] rounded-3xl -z-10 shadow-sm transition-transform group-hover:top-4 group-hover:-bottom-4" />
          <div className="absolute inset-0 top-1.5 -bottom-1.5 mx-1 bg-[#FAF6F4] border-[1.5px] border-[#d64b38] rounded-3xl -z-10 shadow-xs" />

          {/* Front Card */}
          <div className="bg-[#FAF6F4] border-2 border-[#d64b38] rounded-3xl p-6 sm:p-7 flex flex-col items-center justify-center gap-4 shadow-md min-h-[220px] transition-all group-hover:border-[#c0402e] group-hover:shadow-lg">
            <ItalianFlagBadge className="w-16 h-16 sm:w-20 sm:h-20" />
            <div className="flex flex-col items-center">
              <span className="font-semibold text-slate-800 text-xs sm:text-sm leading-tight">
                Libri in
              </span>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm leading-tight">
                italiano
              </span>
              <span className="text-[10px] text-slate-400 mt-2 font-medium">
                {italianCount} {italianCount === 1 ? "disponibile" : "disponibili"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* International Books Deck */}
        <motion.div
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onPickBook("international")}
          className="relative group cursor-pointer select-none"
        >
          {/* Stacked background cards effect (layered at the bottom) */}
          <div className="absolute inset-0 top-3 -bottom-3 mx-2 bg-[#FAF6F4] border-[1.5px] border-[#d64b38] rounded-3xl -z-10 shadow-sm transition-transform group-hover:top-4 group-hover:-bottom-4" />
          <div className="absolute inset-0 top-1.5 -bottom-1.5 mx-1 bg-[#FAF6F4] border-[1.5px] border-[#d64b38] rounded-3xl -z-10 shadow-xs" />

          {/* Front Card */}
          <div className="bg-[#FAF6F4] border-2 border-[#d64b38] rounded-3xl p-6 sm:p-7 flex flex-col items-center justify-center gap-4 shadow-md min-h-[220px] transition-all group-hover:border-[#c0402e] group-hover:shadow-lg">
            <WorldGlobeBadge className="w-16 h-16 sm:w-20 sm:h-20" />
            <div className="flex flex-col items-center">
              <span className="font-semibold text-slate-800 text-xs sm:text-sm leading-tight">
                Libri
              </span>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm leading-tight">
                internazionali
              </span>
              <span className="text-[10px] text-slate-400 mt-2 font-medium">
                {internationalCount} {internationalCount === 1 ? "disponibile" : "disponibili"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Shuffle Any or Add when empty */}
      <div className="mt-12 flex flex-col items-center gap-3">
        {toReadBooks.length > 0 ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPickBook("all")}
            className="bg-[#d64b38] hover:bg-[#c0402e] text-white px-5 py-2.5 rounded-2xl shadow-lg border border-white/20 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Shuffle className="w-4 h-4 stroke-[2.5]" />
            Pesca tra tutti i libri ({toReadBooks.length})
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 bg-orange-50/70 rounded-2xl border border-orange-200 text-center max-w-sm">
            <BookOpen className="w-6 h-6 text-[#d64b38]" />
            <span className="text-xs font-bold text-slate-800">Nessun libro in &ldquo;Da leggere&rdquo;</span>
            <p className="text-[11px] text-slate-500">
              Aggiungi alcuni libri con il pulsante &ldquo;+&rdquo; per poterli pescare!
            </p>
            <button
              onClick={onAddNewBook}
              className="mt-1 bg-[#d64b38] text-white text-xs font-semibold px-4 py-1.5 rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Aggiungi il tuo primo libro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
