import React, { useState } from "react";
import { Link, X, Sparkles, Loader2, Check } from "lucide-react";
import { GeneralLinkItem, MainCategory } from "../types";

interface AddOtherLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<GeneralLinkItem, "id" | "createdAt">) => void;
  defaultCategory: MainCategory;
}

export default function AddOtherLinkModal({
  isOpen,
  onClose,
  onAddItem,
  defaultCategory,
}: AddOtherLinkModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<"ideas" | "books" | "movies" | "recipes">("ideas");
  const [isLoading, setIsLoading] = useState(false);

  // Sync category when modal opens with a different tab active
  React.useEffect(() => {
    if (defaultCategory !== "travel") {
      setCategory(defaultCategory as any);
    }
  }, [defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleFetchMetadata = async () => {
    if (!url) return;
    setIsLoading(true);

    try {
      // Use our server-side Gemini endpoint to auto-extract website details!
      const response = await fetch("/api/analyze-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: url, category: category }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        setTitle(result.data.title || "Link Salvato");
        setDescription(result.data.description || "Nessuna descrizione disponibile.");
      }
    } catch (err) {
      console.error("AI auto extraction failed:", err);
      // Fallback
      setTitle(new URL(url).hostname);
      setDescription("Sito web o post social salvato per riferimento futuro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    // Get an elegant placeholder image based on category
    let imageUrl = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=300&q=80"; // generic creative
    if (category === "books") {
      imageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80"; // Books
    } else if (category === "movies") {
      imageUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80"; // Movies
    } else if (category === "recipes") {
      imageUrl = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=300&q=80"; // Cooking
    }

    onAddItem({
      title,
      link: url,
      description,
      notes: notes || undefined,
      category,
      imageUrl,
    });

    // Reset Form
    setTitle("");
    setUrl("");
    setDescription("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#FAF6F4] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-white/40 flex flex-col max-h-[90vh]">
        
        <div className="p-5 pb-3 flex justify-between items-center border-b border-orange-100 bg-white/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Link className="w-5 h-5 text-orange-500" />
            Salva Link
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* URL link field */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Link del post o del sito</label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                placeholder="https://example.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              />
              <button
                type="button"
                disabled={isLoading || !url}
                onClick={handleFetchMetadata}
                className="bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1 border border-orange-200 cursor-pointer transition-colors"
                title="Estrai info con AI"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI
              </button>
            </div>
          </div>

          {/* Tab category selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Seleziona Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "ideas", label: "🎨 Idee & Appunti" },
                { value: "books", label: "📚 Libri & Letture" },
                { value: "movies", label: "🎬 Film & Video" },
                { value: "recipes", label: "🍳 Ricette & Cibo" }
              ].map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                    category === cat.value
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title Field */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Titolo / Nome</label>
            <input
              type="text"
              required
              placeholder="E.g., Ricetta pasta fresca, Video design, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-orange-400 outline-none font-semibold"
            />
          </div>

          {/* Description Field */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Descrizione o sommario</label>
            <textarea
              rows={2}
              placeholder="Di cosa tratta questo link?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-orange-400 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Personal notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Note personali (opzionale)</label>
            <textarea
              rows={2}
              placeholder="Aggiungi appunti o perché hai salvato questo link..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-orange-400 outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-orange-500/10 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salva Link
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
