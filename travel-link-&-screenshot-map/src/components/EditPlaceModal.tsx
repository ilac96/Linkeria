import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Check, Pencil } from "lucide-react";
import { Place } from "../types";

interface EditPlaceModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlace: (updatedPlace: Place) => void;
}

// Utility per comprimere l'immagine ed evitare di appesantire il DB
const compressImage = (file: File, maxWidth = 600, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Errore Context Canvas");

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function EditPlaceModal({
  place,
  isOpen,
  onClose,
  onUpdatePlace,
}: EditPlaceModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"food" | "sight" | "nature">("sight");
  const [imageUrl, setImageUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizza lo stato del form ogni volta che cambia il luogo selezionato
  useEffect(() => {
    if (place) {
      setTitle(place.title || "");
      setDescription(place.description || "");
      setCategory(place.category || "sight");
      setImageUrl(place.imageUrl || "");
    }
  }, [place]);

  if (!isOpen || !place) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressed = await compressImage(e.target.files[0], 600, 0.7);
        setImageUrl(compressed);
      } catch (err) {
        console.error("Errore caricamento foto:", err);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePlace({
      ...place,
      title,
      description,
      category,
      imageUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 pb-3 flex justify-between items-center border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Pencil className="w-4 h-4 text-orange-500" />
            Modifica Luogo
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleFormSubmit} className="p-5 flex flex-col gap-4">
          {/* Modifica Immagine */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Foto di Copertina
            </label>
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-white shadow-sm relative">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Carica / Cambia Foto
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Modifica Titolo */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Titolo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Modifica Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory("food")}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  category === "food"
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                🍕 Cibo
              </button>
              <button
                type="button"
                onClick={() => setCategory("sight")}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  category === "sight"
                    ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                📸 Attrazione
              </button>
              <button
                type="button"
                onClick={() => setCategory("nature")}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  category === "nature"
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                🌳 Natura
              </button>
            </div>
          </div>

          {/* Modifica Descrizione */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Descrizione / Note
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Pulsanti Azione */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#d64b38] hover:bg-[#c0402e] text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salva Modifiche
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}