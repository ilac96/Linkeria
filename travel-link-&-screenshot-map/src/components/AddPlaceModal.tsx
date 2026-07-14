import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Sparkles, AlertCircle, Check, Info } from "lucide-react";
import { Place } from "../types";

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: Omit<Place, "id" | "createdAt" | "visited">) => void;
  clickedCoords?: { lat: number; lng: number } | null;
}

export default function AddPlaceModal({
  isOpen,
  onClose,
  onAddPlace,
  clickedCoords,
}: AddPlaceModalProps) {
  const [postLink, setPostLink] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Review Screen States (after AI extraction)
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      setError("Il file è troppo grande. Dimensione massima supportata: 15MB");
      return;
    }
    setImageName(file.name);
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

  // Trigger Gemini analysis call on the server
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postLink && !selectedImage) {
      setError("Inserisci un link o carica uno screenshot prima di procedere!");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Rotate realistic loading messages to delight the traveler
    const messages = [
      "Contatto l'intelligenza artificiale per svelare il luogo...",
      "Analisi dello screenshot e dei dettagli della foto...",
      "Identificazione delle coordinate geografiche di Roma...",
      "Compilazione della descrizione in italiano e itinerari a piedi...",
      "Ci siamo quasi, preparo la scheda di viaggio..."
    ];
    let msgIdx = 0;
    setLoadingMessage(messages[0]);
    const timer = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setLoadingMessage(messages[msgIdx]);
    }, 2000);

    try {
      const response = await fetch("/api/analyze-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: postLink,
          screenshot: selectedImage,
        }),
      });

      const result = await response.json();
      clearInterval(timer);

      if (result.success && result.data) {
        // Pre-populate with clicked coords if user selected on map first
        if (clickedCoords) {
          result.data.lat = clickedCoords.lat;
          result.data.lng = clickedCoords.lng;
        }
        setExtractedData(result.data);
      } else {
        throw new Error(result.error || "Impossibile estrarre i dettagli del luogo.");
      }
    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      setError("Si è verificato un errore durante l'analisi AI. Puoi inserire i dettagli manualmente.");
      
      // Load fallback editable data structures in case of complete crash
      setExtractedData({
        title: "Nuovo Posto",
        description: "Scrivi qui una breve descrizione di questo luogo da visitare.",
        category: "sight",
        lat: clickedCoords?.lat || 41.8902,
        lng: clickedCoords?.lng || 12.4922,
        walkingDirections: "Raggiungibile a piedi o con mezzi pubblici.",
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${clickedCoords?.lat || 41.8902},${clickedCoords?.lng || 12.4922}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlace = () => {
    if (!extractedData.title) return;
    
    // We can use a gorgeous preselected visual matching the category or the screenshot itself!
    // If user uploaded a screenshot, we use that as the thumbnail image. 
    // Otherwise we select an incredibly scenic default Rome photo based on category.
    let finalImageUrl = selectedImage;
    if (!finalImageUrl) {
      if (extractedData.category === "food") {
        finalImageUrl = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80"; // Roman Pizza
      } else if (extractedData.category === "nature") {
        finalImageUrl = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80"; // Roman garden/pine trees
      } else {
        finalImageUrl = "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=500&q=80"; // Trastevere / Rome Street
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

    // Reset Form
    setPostLink("");
    setSelectedImage(null);
    setImageName(null);
    setExtractedData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      
      {/* Container Card matches Screenshot 1 Modal background */}
      <div className="bg-[#FAF6F4] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-white/40 flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="p-5 pb-3 flex justify-between items-center border-b border-orange-100 bg-white/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500 fill-orange-200" />
            {extractedData ? "Verifica dettagli" : "Aggiungi alla lista"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-500 transition-colors"
          >
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

          {/* Loader Overlay */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
              <div className="flex flex-col gap-1 px-4">
                <span className="font-semibold text-slate-800">Elaborazione in corso...</span>
                <p className="text-xs text-slate-500 animate-pulse">{loadingMessage}</p>
              </div>
            </div>
          ) : !extractedData ? (
            /* Screenshot 1 exact drag-and-drop form screen */
            <form onSubmit={handleAnalyze} className="flex flex-col gap-5">
              
              {/* Drag and drop screenshot upload box */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  dragActive
                    ? "border-orange-500 bg-orange-50/50 scale-[0.98]"
                    : selectedImage
                    ? "border-emerald-400 bg-emerald-50/20"
                    : "border-slate-300 hover:border-orange-400 bg-white"
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
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md border border-white">
                      <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Screenshot pronto!
                    </span>
                    <span className="text-[10px] text-slate-400 max-w-[200px] truncate">{imageName}</span>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-orange-50 text-[#d64b38] rounded-full">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-slate-700">
                        Drag & Drop or <span className="text-[#d64b38] hover:underline font-semibold">Choose file</span> to upload
                      </p>
                      <span className="text-xs text-slate-400 font-mono">JPG, GIF or PNG. Max size of 800K</span>
                    </div>
                  </>
                )}
              </div>

              {/* "oppure" label matching visual layout */}
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] bg-slate-300 flex-1" />
                <span className="text-xs text-slate-500 lowercase font-medium px-2 bg-[#FAF6F4]">oppure</span>
                <div className="h-[1px] bg-slate-300 flex-1" />
              </div>

              {/* Paste Post Link input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">Inserisci il link del post</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/p/... o TikTok..."
                  value={postLink}
                  onChange={(e) => setPostLink(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
                />
              </div>

              {clickedCoords && (
                <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex gap-2.5 items-start">
                  <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700">Tappa selezionata su mappa</span>
                    <p className="text-[10px] text-slate-500 font-mono">Lat: {clickedCoords.lat.toFixed(5)} | Lng: {clickedCoords.lng.toFixed(5)}</p>
                  </div>
                </div>
              )}

              {/* Action Button: "Aggiungi" matches Red / Coral style */}
              <button
                type="submit"
                className="w-full bg-[#d64b38] hover:bg-[#c0402e] active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-700/10 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide mt-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                Trova con AI
              </button>
            </form>
          ) : (
            /* AI extraction review / edit screen so user confirms detail values */
            <div className="flex flex-col gap-4">
              <div className="bg-orange-50 text-[#d64b38] rounded-xl p-3 text-xs flex gap-2 items-center border border-orange-100 font-medium">
                <Sparkles className="w-4 h-4 shrink-0 fill-[#d64b38]/20" />
                Ecco i dettagli estratti dall'AI! Puoi modificarli prima di salvare.
              </div>

              {/* Title Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Nome del Posto</label>
                <input
                  type="text"
                  value={extractedData.title}
                  onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-orange-400 outline-none font-semibold"
                />
              </div>

              {/* Category selector in review */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "food", label: "🍕 Cibo", activeBg: "bg-amber-400 text-white" },
                    { value: "sight", label: "📸 Attrazione", activeBg: "bg-sky-400 text-white" },
                    { value: "nature", label: "🌳 Natura", activeBg: "bg-emerald-400 text-white" }
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setExtractedData({ ...extractedData, category: cat.value })}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                        extractedData.category === cat.value
                          ? cat.activeBg
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Descrizione (1 o 2 righe)</label>
                <textarea
                  rows={2}
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-orange-400 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Coordinates fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Latitudine</label>
                  <input
                    type="number"
                    step="any"
                    value={extractedData.lat}
                    onChange={(e) => setExtractedData({ ...extractedData, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-orange-400 outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Longitudine</label>
                  <input
                    type="number"
                    step="any"
                    value={extractedData.lng}
                    onChange={(e) => setExtractedData({ ...extractedData, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-orange-400 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Walking Directions Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Come Arrivare / Indicazioni</label>
                <input
                  type="text"
                  value={extractedData.walkingDirections}
                  onChange={(e) => setExtractedData({ ...extractedData, walkingDirections: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>

              {/* Map Link Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Link Google Maps</label>
                <input
                  type="url"
                  value={extractedData.mapUrl}
                  onChange={(e) => setExtractedData({ ...extractedData, mapUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Ricomincia
                </button>
                <button
                  type="button"
                  onClick={handleSavePlace}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Salva Luogo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
