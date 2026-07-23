import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Sparkles, AlertCircle, Check, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { Place } from "../types";
import { supabase } from "../supabaseClient";

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: Omit<Place, "id" | "createdAt" | "visited">) => void;
  clickedCoords?: { lat: number; lng: number } | null;
}

async function geocodeAddress(query: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": "TravelPlannerApp/1.0" } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (err) {
    console.error("Errore Geocoding:", err);
  }
  return null;
}

export default function AddPlaceModal({
  isOpen,
  onClose,
  onAddPlace,
  clickedCoords,
}: AddPlaceModalProps) {
  const [postLink, setPostLink] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);

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

    const cleanLink = postLink.trim();

    // Verifichiamo che sia stato inserito ALMENO un elemento
    if (!cleanLink && !selectedImage) {
      setError("Inserisci un link OPPURE carica uno screenshot per continuare.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage("L'AI sta analizzando il tuo elemento...");

    try {
      const payload = {
        link: cleanLink || null,
        base64Image: selectedImage || null,
      };

      const { data: aiResult, error: fnError } = await supabase.functions.invoke("analyze-place", {
        body: payload,
      });

      if (fnError) {
        let realMessage = fnError.message;
        try {
          const errBody = await fnError.context.json();
          if (errBody?.error) realMessage = errBody.error;
        } catch (_) {}
        throw new Error(realMessage);
      }

      if (aiResult?.error) throw new Error(aiResult.error);

      let coords = clickedCoords ? { lat: clickedCoords.lat, lng: clickedCoords.lng } : null;
      if (!coords && aiResult.searchQuery) {
        coords = await geocodeAddress(aiResult.searchQuery || aiResult.title);
      }

      setExtractedData({
        title: aiResult.title || "Nuovo Luogo",
        description: aiResult.description || "Aggiunto automaticamente dall'AI.",
        category: aiResult.category || "sight",
        lat: coords ? coords.lat : 41.8902,
        lng: coords ? coords.lng : 12.4922,
        walkingDirections: "Raggiungibile a piedi o con i mezzi.",
        mapUrl: cleanLink || (coords ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : ""),
        imageUrl: selectedImage,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Impossibile analizzare con l'AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlace = () => {
    if (!extractedData.title) return;

    let finalImageUrl = extractedData.imageUrl || selectedImage;
    if (!finalImageUrl) {
      if (extractedData.category === "food") {
        finalImageUrl = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80";
      } else if (extractedData.category === "nature") {
        finalImageUrl = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80";
      } else {
        finalImageUrl = "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=500&q=80";
      }
    }

    onAddPlace({
      title: extractedData.title,
      description: extractedData.description,
      category: extractedData.category as "food" | "sight" | "nature",
      lat: Number(extractedData.lat),
      lng: Number(extractedData.lng),
      walkingDirections: extractedData.walkingDirections,
      mapUrl: extractedData.mapUrl,
      imageUrl: finalImageUrl,
      originalLink: postLink || undefined,
      favorite: false,
    });

    setPostLink("");
    setSelectedImage(null);
    setExtractedData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#FAF6F4] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-white/40 flex flex-col max-h-[90vh]">
        <div className="p-5 pb-3 flex justify-between items-center border-b border-orange-100 bg-white/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500 fill-orange-200" />
            {extractedData ? "Verifica dettagli" : "Aggiungi alla lista"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-xs flex gap-2 items-center border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
              <div className="flex flex-col gap-1 px-4">
                <span className="font-semibold text-slate-800">Analisi AI in corso...</span>
                <p className="text-xs text-slate-500 animate-pulse">{loadingMessage}</p>
              </div>
            </div>
          ) : !extractedData ? (
            <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
              {/* Opzione 1: Screenshot */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
                  Opzione A: Screenshot
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    dragActive
                      ? "border-orange-500 bg-orange-50/50"
                      : selectedImage
                      ? "border-emerald-400 bg-emerald-50/20"
                      : "border-slate-300 hover:border-orange-400 bg-white"
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
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
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <Upload className="w-4 h-4 text-orange-500" />
                      <p className="text-xs font-medium text-slate-600">Carica o trascina foto</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase">oppure</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Opzione 2: Link */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-orange-500" />
                  Opzione B: Link del post
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/p/... o TikTok..."
                  value={postLink}
                  onChange={(e) => {
                    setPostLink(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#d64b38] hover:bg-[#c0402e] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase cursor-pointer mt-2"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                Elabora e Trova Luogo
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-emerald-50 text-emerald-700 rounded-xl p-3 text-xs flex gap-2 items-center border border-emerald-200 font-medium">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                L'AI ha trovato il posto! Controlla e conferma:
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nome e Città</label>
                <input
                  type="text"
                  value={extractedData.title}
                  onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm font-semibold outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Descrizione</label>
                <textarea
                  rows={2}
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Ricomincia
                </button>
                <button
                  type="button"
                  onClick={handleSavePlace}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
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

