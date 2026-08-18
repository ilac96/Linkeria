import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Sparkles, AlertCircle, Check, Link as LinkIcon, Image as ImageIcon, BookOpen, PenLine } from "lucide-react";
import { BookItem } from "../types";
import { ItalianFlagBadge, WorldGlobeBadge } from "./BookBadges";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Omit<BookItem, "id" | "createdAt">) => void;
}

interface ExtractedBookData {
  title: string;
  author: string;
  description: string;
  language: "italian" | "international";
  read: boolean;
  notes?: string;
  link?: string;
  imageUrl?: string | null;
}

export default function AddBookModal({
  isOpen,
  onClose,
  onAddBook,
}: AddBookModalProps) {
  const [postInput, setPostInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedBookData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      setError("Il file è troppo grande (Max 15MB)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanInput = postInput.trim();

    // Verifichiamo che sia stato inserito ALMENO un elemento
    if (!cleanInput && !selectedImage) {
      setError("Inserisci un titolo/link OPPURE carica uno screenshot (es. da Instagram) per continuare.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage("L'AI sta analizzando la foto o il titolo del libro...");

    try {
      let aiData: any = null;

      const resp = await fetch("/api/analyze-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: cleanInput || null,
          screenshot: selectedImage || null,
          category: "books",
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json?.data) {
          aiData = json.data;
        }
      }

      if (!aiData) {
        throw new Error("L'AI non è riuscita a estrarre i dettagli del libro. Puoi comunque compilare i campi a mano.");
      }

      setExtractedData({
        title: aiData.title || cleanInput || "Nuovo Libro",
        author: aiData.author || "Autore non specificato",
        description: aiData.description || "Descrizione e trama del libro.",
        language: aiData.language === "international" ? "international" : "italian",
        read: false,
        notes: "",
        link: cleanInput.startsWith("http") ? cleanInput : undefined,
        imageUrl: selectedImage || aiData.imageUrl || null,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Impossibile analizzare con l'AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntry = () => {
    setError(null);
    setExtractedData({
      title: postInput.trim() || "",
      author: "",
      description: "",
      language: "italian",
      read: false,
      notes: "",
      link: postInput.trim().startsWith("http") ? postInput.trim() : undefined,
      imageUrl: selectedImage || null,
    });
  };

  const handleSaveBook = () => {
    if (!extractedData || !extractedData.title.trim()) return;

    onAddBook({
      title: extractedData.title.trim(),
      author: extractedData.author.trim() || "Autore non specificato",
      description: extractedData.description.trim() || "Nessuna descrizione specificata.",
      language: extractedData.language,
      read: extractedData.read,
      notes: extractedData.notes?.trim() || undefined,
      link: extractedData.link || undefined,
      imageUrl: extractedData.imageUrl || undefined,
      favorite: false,
    });

    setPostInput("");
    setSelectedImage(null);
    setExtractedData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#FAF6F4] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-white/40 flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-5 pb-3 flex justify-between items-center border-b border-orange-100 bg-white/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d64b38] fill-orange-200" />
            {extractedData ? "Verifica dettagli libro" : "Aggiungi alla lista"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-xs flex gap-2 items-center border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            /* Loading State */
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-12 h-12 text-[#d64b38] animate-spin" />
              <div className="flex flex-col gap-1 px-4">
                <span className="font-semibold text-slate-800">Analisi AI in corso...</span>
                <p className="text-xs text-slate-500 animate-pulse">{loadingMessage}</p>
              </div>
            </div>
          ) : !extractedData ? (
            /* Step 1: Input Form (Same layout as AddPlaceModal) */
            <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
              
              {/* Opzione A: Screenshot */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#d64b38]" />
                  Opzione A: Screenshot da Instagram o Foto
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    dragActive
                      ? "border-[#d64b38] bg-orange-50/50"
                      : selectedImage
                      ? "border-emerald-400 bg-emerald-50/20"
                      : "border-slate-300 hover:border-[#d64b38] bg-white"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  {selectedImage ? (
                    <div className="flex items-center gap-3 w-full justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white shadow-sm shrink-0">
                          <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Screenshot caricato
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(null);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <Upload className="w-4 h-4 text-[#d64b38]" />
                      <p className="text-xs font-medium text-slate-600">Carica screenshot post o copertina</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Separatore */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase">oppure</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Opzione B: Titolo o Link */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#d64b38]" />
                  Opzione B: Titolo o Link del post
                </label>
                <input
                  type="text"
                  placeholder="es. Il nome della rosa oppure link Instagram / Goodreads..."
                  value={postInput}
                  onChange={(e) => {
                    setPostInput(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#d64b38]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#d64b38] hover:bg-[#c0402e] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase cursor-pointer mt-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                Elabora e Trova Libro
              </button>

              {/* Inserimento manuale rapido */}
              <button
                type="button"
                onClick={handleManualEntry}
                className="text-center text-[11px] font-medium text-slate-500 hover:text-slate-700 underline cursor-pointer pt-1"
              >
                oppure compila manualmente i campi
              </button>
            </form>
          ) : (
            /* Step 2: Verification Form (Same layout as AddPlaceModal) */
            <div className="flex flex-col gap-4">
              <div className="bg-emerald-50 text-emerald-700 rounded-xl p-3 text-xs flex gap-2 items-center border border-emerald-200 font-medium">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                L'AI ha trovato il libro! Controlla e conferma:
              </div>

              {/* Titolo */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Titolo del libro *</label>
                <input
                  type="text"
                  value={extractedData.title}
                  onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#d64b38]"
                />
              </div>

              {/* Autore */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Autore</label>
                <input
                  type="text"
                  value={extractedData.author}
                  onChange={(e) => setExtractedData({ ...extractedData, author: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-[#d64b38]"
                />
              </div>

              {/* Categoria Lingua */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria Lingua</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExtractedData({ ...extractedData, language: "italian" })}
                    className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                      extractedData.language === "italian"
                        ? "bg-white border-[#78a964] shadow-xs ring-2 ring-[#78a964]/20"
                        : "bg-white/60 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <ItalianFlagBadge className="w-8 h-8" />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800">In Italiano</span>
                      <span className="text-[10px] text-slate-500">Letteratura IT</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExtractedData({ ...extractedData, language: "international" })}
                    className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                      extractedData.language === "international"
                        ? "bg-white border-[#4fa1e2] shadow-xs ring-2 ring-[#4fa1e2]/20"
                        : "bg-white/60 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <WorldGlobeBadge className="w-8 h-8" />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800">Internazionale</span>
                      <span className="text-[10px] text-slate-500">Mondo / Tradotto</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Stato: Da leggere vs Letto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Stato</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExtractedData({ ...extractedData, read: false })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      !extractedData.read
                        ? "bg-[#d64b38] text-white border-[#d64b38] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    📖 Da leggere
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtractedData({ ...extractedData, read: true })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      extractedData.read
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    ✓ Già letto
                  </button>
                </div>
              </div>

              {/* Descrizione */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Descrizione / Trama</label>
                <textarea
                  rows={3}
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs outline-none resize-none focus:ring-2 focus:ring-[#d64b38]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Ricomincia
                </button>
                <button
                  type="button"
                  onClick={handleSaveBook}
                  disabled={!extractedData.title.trim()}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  Conferma e Salva
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
