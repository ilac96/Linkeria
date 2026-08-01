import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Plane,
  PenTool,
  BookOpen,
  Film,
  ChefHat,
  List as ListIcon,
  Map as MapIcon,
  Plus,
  Search,
  Heart,
  ExternalLink,
  Trash2,
  Sparkles,
  X,
  FileText,
  Pencil,
  Utensils,   // ⬅️ nuovo
  Camera,     // ⬅️ nuovo
  Trees,      // ⬅️ nuovo
  ChevronRight
} from "lucide-react";
import { Place, GeneralLinkItem, MainCategory } from "./types";
import MapComponent from "./components/MapComponent";
import AddPlaceModal from "./components/AddPlaceModal";
import AddOtherLinkModal from "./components/AddOtherLinkModal";
import EditPlaceModal from "./components/EditPlaceModal";
import foodIllustration from "./components/illustrations/food.svg";
import naturaIllustration from "./components/illustrations/natura.svg";
import photoIllustration from "./components/illustrations/photo.svg";

const categoryConfig = {
  nature: { borderColor: "border-l-emerald-500", illustration: naturaIllustration },
  food:   { borderColor: "border-l-amber-400",   illustration: foodIllustration },
  sight:  { borderColor: "border-l-sky-500",     illustration: photoIllustration },
}

const CATEGORY = {
  food:   { Icon: Utensils, label: "Cibo",       bg: "bg-amber-50",   text: "text-amber-700",  bar: "bg-amber-400" },
  sight:  { Icon: Camera,   label: "Attrazione", bg: "bg-sky-50",     text: "text-sky-700",    bar: "bg-sky-400" },
  nature: { Icon: Trees,    label: "Natura",     bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-400" },
};

interface LinksRow {
  id: string;
  created_at: string;
  category: string;
  source_type: string | null;
  title: string;
  original_url: string | null;
  image_url: string | null;
  notes: string | null;
  status: string | null;
  metadata: Record<string, any> | null;
}

function rowToPlace(row: LinksRow): Place {
  const meta = row.metadata || {};
  
  const validSubcategories = ["food", "sight", "nature"];
  const subcategory = meta.subcategory || (validSubcategories.includes(row.category) ? row.category : "sight");

  // 1. Pulizia immagini base64 troppo pesanti (> 50KB)
  let validImageUrl = row.image_url || meta.imageUrl || "";
  if (validImageUrl.startsWith("data:image/") && validImageUrl.length > 50000) {
    validImageUrl = ""; // Resetta l'immagine se è una stringa base64 gigante che blocca Supabase
  }

  return {
    id: row.id,
    title: row.title || "Senza Titolo",
    description: meta.description || row.notes || "",
    category: subcategory as "food" | "sight" | "nature",
    lat: typeof meta.lat === "number" ? meta.lat : 0,
    lng: typeof meta.lng === "number" ? meta.lng : 0,
    walkingDirections: meta.walkingDirections || "",
    mapUrl: row.original_url || meta.mapUrl || "",
    visited: row.status === "visited",
    imageUrl: validImageUrl,
    createdAt: row.created_at,
    favorite: !!meta.favorite,
  };
}

function placeToInsertRow(place: Omit<Place, "id" | "createdAt" | "visited">) {
  let cleanImageUrl = place.imageUrl || null;
  if (cleanImageUrl && cleanImageUrl.startsWith("data:image/") && cleanImageUrl.length > 50000) {
    cleanImageUrl = null;
  }

  return {
    category: "travel",
    source_type: "manual",
    title: place.title,
    original_url: place.mapUrl || null,
    image_url: cleanImageUrl,
    notes: null,
    status: "to_visit",
    metadata: {
      subcategory: place.category,
      description: place.description,
      lat: place.lat,
      lng: place.lng,
      walkingDirections: place.walkingDirections,
      mapUrl: place.mapUrl,
      favorite: place.favorite,
    },
  };
}

function rowToOtherLink(row: LinksRow): GeneralLinkItem {
  const meta = row.metadata || {};
  return {
    id: row.id,
    title: row.title,
    link: row.original_url || "",
    description: meta.description || "",
    notes: row.notes || "",
    category: row.category as GeneralLinkItem["category"],
    createdAt: row.created_at,
    imageUrl: row.image_url || "",
  };
}

function otherLinkToInsertRow(item: Omit<GeneralLinkItem, "id" | "createdAt">) {
  return {
    category: item.category,
    source_type: "manual",
    title: item.title,
    original_url: item.link || null,
    image_url: item.imageUrl || null,
    notes: item.notes || null,
    status: null,
    metadata: {
      description: item.description,
    },
  };
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MainCategory>("travel");
  const [travelSubTab, setTravelSubTab] = useState<"da-visitare" | "visitati">("da-visitare");
  const [layoutMode, setLayoutMode] = useState<"list" | "map">("list");

  // Dati caricati da Supabase
  const [places, setPlaces] = useState<Place[]>([]);
  const [otherLinks, setOtherLinks] = useState<GeneralLinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modifica Luogo
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<"food" | "sight" | "nature" | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOtherLinkModalOpen, setIsOtherLinkModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ---------- CARICAMENTO DATI DA SUPABASE ----------
  useEffect(() => {
    const caricaDatiDaSupabase = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("links")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rows = (data || []) as LinksRow[];
        const travelCategories = ["travel", "food", "sight", "nature"];

        const travelRows = rows.filter(
          (r) => travelCategories.includes(r.category) || r.metadata?.subcategory
        );
        
        const otherRows = rows.filter(
          (r) => !travelCategories.includes(r.category) && !r.metadata?.subcategory
        );

        setPlaces(travelRows.map(rowToPlace));
        setOtherLinks(otherRows.map(rowToOtherLink));
      } catch (error) {
        console.error("Errore nel caricamento da Supabase:", error);
      } finally {
        setLoading(false);
      }
    };

    caricaDatiDaSupabase();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">
        Connessione al database in corso...
      </div>
    );
  }

  // ---------- MODIFICA DI UN POSTO ESISTENTE ----------
  const handleUpdatePlace = async (updatedPlace: Place) => {
    try {
      setPlaces((prevPlaces) =>
        prevPlaces.map((p) => (p.id === updatedPlace.id ? updatedPlace : p))
      );

      const updatedMetadata = {
        subcategory: updatedPlace.category,
        description: updatedPlace.description,
        lat: updatedPlace.lat,
        lng: updatedPlace.lng,
        walkingDirections: updatedPlace.walkingDirections,
        mapUrl: updatedPlace.mapUrl,
        favorite: updatedPlace.favorite,
      };

      const { error } = await supabase
        .from("links")
        .update({
          title: updatedPlace.title,
          image_url: updatedPlace.imageUrl || null,
          metadata: updatedMetadata,
        })
        .eq("id", updatedPlace.id);

      if (error) {
        console.error("Errore durante l'aggiornamento su Supabase:", error);
        alert("Errore durante il salvataggio delle modifiche.");
        return;
      }

      setEditingPlace(null);
    } catch (err) {
      console.error("Errore imprevisto:", err);
    }
  };

  // ---------- AGGIUNTA DI UN NUOVO POSTO (VIAGGI) ----------
  const handleAddPlace = async (newPlace: Omit<Place, "id" | "createdAt" | "visited">) => {
    try {
      const rowToInsert = placeToInsertRow(newPlace);

      const { data, error } = await supabase
        .from("links")
        .insert([rowToInsert])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const inserted = rowToPlace(data[0] as LinksRow);
        setPlaces([inserted, ...places]);
      }

      setClickedCoords(null);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Errore durante il salvataggio su Supabase:", error);
      alert("Non è stato possibile salvare il punto sulla mappa. Riprova!");
    }
  };

  // ---------- AGGIUNTA DI UN NUOVO LINK ----------
  const handleAddOtherLink = async (newItem: Omit<GeneralLinkItem, "id" | "createdAt">) => {
    try {
      const rowToInsert = otherLinkToInsertRow(newItem);

      const { data, error } = await supabase
        .from("links")
        .insert([rowToInsert])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const inserted = rowToOtherLink(data[0] as LinksRow);
        setOtherLinks([inserted, ...otherLinks]);
      }

      setIsOtherLinkModalOpen(false);
    } catch (error) {
      console.error("Errore durante il salvataggio su Supabase:", error);
      alert("Non è stato possibile salvare il link. Riprova!");
    }
  };

  // ---------- TOGGLE VISITATO ----------
  const handleToggleVisited = async (id: string) => {
    const place = places.find((p) => p.id === id);
    if (!place) return;
    const nuovoStatus = place.visited ? "to_visit" : "visited";

    setPlaces(places.map((p) => (p.id === id ? { ...p, visited: !p.visited } : p)));

    const { error } = await supabase
      .from("links")
      .update({ status: nuovoStatus })
      .eq("id", id);

    if (error) {
      console.error("Errore aggiornando lo stato visitato:", error);
    }
  };

  // ---------- TOGGLE PREFERITO ----------
  const handleToggleFavorite = async (id: string) => {
    const place = places.find((p) => p.id === id);
    if (!place) return;
    const nuovoMetadata = {
      subcategory: place.category,
      description: place.description,
      lat: place.lat,
      lng: place.lng,
      walkingDirections: place.walkingDirections,
      mapUrl: place.mapUrl,
      favorite: !place.favorite,
    };

    setPlaces(places.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)));

    const { error } = await supabase
      .from("links")
      .update({ metadata: nuovoMetadata })
      .eq("id", id);

    if (error) {
      console.error("Errore aggiornando il preferito:", error);
    }
  };

  // ---------- ELIMINA POSTO ----------
  const handleDeletePlace = async (id: string) => {
    setPlaces(places.filter((p) => p.id !== id));
    if (selectedPlaceId === id) setSelectedPlaceId(null);

    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      console.error("Errore eliminando il posto:", error);
    }
  };

  // ---------- ELIMINA ALTRO LINK ----------
  const handleDeleteOtherLink = async (id: string) => {
    setOtherLinks(otherLinks.filter((item) => item.id !== id));

    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      console.error("Errore eliminando il link:", error);
    }
  };

  // ---------- FILTRI ----------
  const filteredPlaces = places.filter((place) => {
    const isTabMatch = travelSubTab === "da-visitare" ? !place.visited : place.visited;
    if (!isTabMatch) return false;

    const matchesSearch =
      place.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.walkingDirections.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategoryFilter && place.category !== selectedCategoryFilter) return false;

    return true;
  });

  const filteredOtherLinks = otherLinks.filter((item) => {
    if (item.category !== activeTab) return false;
    if (!searchQuery) return true;
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col xl:py-8 xl:px-4 items-center justify-start">
      <div className="w-full xl:max-w-6xl bg-white xl:rounded-[32px] xl:shadow-2xl overflow-hidden flex flex-col h-screen xl:h-[820px] relative border-0 xl:border border-slate-200">

        {/* BARRA DI NAVIGAZIONE FLUTTUANTE A PILLOLA */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#d64b38] py-2.5 px-6 rounded-full shadow-2xl border border-white/10 flex items-center justify-center gap-6 sm:gap-8 backdrop-blur-md select-none">
          <button
            onClick={() => setActiveTab("travel")}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
              activeTab === "travel"
                ? "bg-white/20 text-white scale-110"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            title="Viaggi"
          >
            <Plane className="w-6 h-6 sm:w-6 sm:h-6 stroke-[2.2]" />
          </button>

          <button
            onClick={() => setActiveTab("ideas")}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
              activeTab === "ideas"
                ? "bg-white/20 text-white scale-110"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            title="Idee"
          >
            <PenTool className="w-6 h-6 sm:w-6 sm:h-6 stroke-[2.2]" />
          </button>

          <button
            onClick={() => setActiveTab("books")}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
              activeTab === "books"
                ? "bg-white/20 text-white scale-110"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            title="Libri"
          >
            <BookOpen className="w-6 h-6 sm:w-6 sm:h-6 stroke-[2.2]" />
          </button>

          <button
            onClick={() => setActiveTab("movies")}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
              activeTab === "movies"
                ? "bg-white/20 text-white scale-110"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            title="Film & Video"
          >
            <Film className="w-6 h-6 sm:w-6 sm:h-6 stroke-[2.2]" />
          </button>

          <button
            onClick={() => setActiveTab("recipes")}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
              activeTab === "recipes"
                ? "bg-white/20 text-white scale-110"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            title="Ricette"
          >
            <ChefHat className="w-6 h-6 sm:w-6 sm:h-6 stroke-[2.2]" />
          </button>
        </div>

        {/* CONTENUTO PRINCIPALE */}
        <div className="flex-1 flex flex-col min-w-0 h-full">

          <div className="bg-white border-b border-slate-100 p-4 pt-5 md:pt-4 shrink-0 shadow-sm z-30">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-50 rounded-xl text-[#d64b38]">
                  <Plane className="w-5 h-5 fill-current transform -rotate-12" />
                </div>
                <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight">
                  {activeTab === "travel" && "Travel"}
                  {activeTab === "ideas" && "Idee"}
                  {activeTab === "books" && "Letture"}
                  {activeTab === "movies" && "Film & Video"}
                  {activeTab === "recipes" && "Ricette"}
                </h1>
              </div>

              {activeTab === "travel" && (
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                  <button
                    onClick={() => {
                      setLayoutMode("list");
                      setSelectedPlaceId(null);
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      layoutMode === "list"
                        ? "bg-white text-[#d64b38] shadow-sm font-semibold scale-105"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Layout Lista"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLayoutMode("map")}
                    className={`p-2 rounded-lg transition-all ${
                      layoutMode === "map"
                        ? "bg-white text-[#d64b38] shadow-sm font-semibold scale-105"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Layout Mappa"
                  >
                    <MapIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {activeTab === "travel" && layoutMode === "list" ? (
              <div className="flex border-b border-slate-200 text-center">
                <button
                  onClick={() => {
                    setTravelSubTab("da-visitare");
                    setSelectedPlaceId(null);
                  }}
                  className={`flex-1 pb-2.5 text-sm font-medium transition-all relative ${
                    travelSubTab === "da-visitare"
                      ? "text-[#d64b38] font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Da visitare
                  {travelSubTab === "da-visitare" && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d64b38] rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setTravelSubTab("visitati");
                    setSelectedPlaceId(null);
                  }}
                  className={`flex-1 pb-2.5 text-sm font-medium transition-all relative ${
                    travelSubTab === "visitati"
                      ? "text-[#d64b38] font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Visitati
                  {travelSubTab === "visitati" && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d64b38] rounded-full" />
                  )}
                </button>
              </div>
            ) : activeTab === "travel" ? (
              <p className="text-xs text-slate-500 bg-sky-50/50 p-2 rounded-lg border border-sky-100 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 fill-sky-200" />
                Tutti i luoghi sono visibili sulla mappa
              </p>
            ) : (
              <p className="text-xs text-slate-500 bg-orange-50/50 p-2 rounded-lg border border-orange-100 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-200" />
                Siti e link salvati divisi per categoria
              </p>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50">
            <div className="p-3 bg-white border-b border-slate-100 flex flex-col gap-2 shrink-0 shadow-sm z-10">
              <div className="relative md:max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={activeTab === "travel" ? "Cerca luogo..." : "Cerca link salvato..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {activeTab === "travel" && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Filtra:</span>

                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all shrink-0 border ${
                      selectedCategoryFilter === null
                        ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Tutti ({places.filter((p) => (travelSubTab === "da-visitare" ? !p.visited : p.visited)).length})
                  </button>

                  <button
                    onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "food" ? null : "food")}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 border ${
                      selectedCategoryFilter === "food"
                        ? "bg-amber-400 text-white border-amber-400 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50"
                    }`}
                  >
                    <span className="text-xs">🍕</span> Cibo ({places.filter((p) => (travelSubTab === "da-visitare" ? !p.visited : p.visited) && p.category === "food").length})
                  </button>

                  <button
                    onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "sight" ? null : "sight")}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 border ${
                      selectedCategoryFilter === "sight"
                        ? "bg-sky-400 text-white border-sky-400 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-sky-50"
                    }`}
                  >
                    <span className="text-xs">📸</span> Attrazioni ({places.filter((p) => (travelSubTab === "da-visitare" ? !p.visited : p.visited) && p.category === "sight").length})
                  </button>

                  <button
                    onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "nature" ? null : "nature")}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 border ${
                      selectedCategoryFilter === "nature"
                        ? "bg-emerald-400 text-white border-emerald-400 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50"
                    }`}
                  >
                    <span className="text-xs">🌳</span> Natura ({places.filter((p) => (travelSubTab === "da-visitare" ? !p.visited : p.visited) && p.category === "nature").length})
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 relative overflow-hidden">
              {activeTab === "travel" && (
                <>
                  {layoutMode === "map" ? (
                    <div className="w-full h-full">
                     <MapComponent
  places={filteredPlaces}
  onToggleVisited={handleToggleVisited}
  onToggleFavorite={handleToggleFavorite}
  onDeletePlace={handleDeletePlace}
  // ⬅️ nuovo
  onEditPlace={setEditingPlace}
  selectedPlaceId={selectedPlaceId}
  setSelectedPlaceId={setSelectedPlaceId}
/>
                    </div>
                  ) : (
                    <div className="w-full h-full overflow-y-auto p-4 pb-28 flex flex-col gap-4 md:grid md:grid-cols-2 xl:grid-cols-3 md:items-start md:content-start">
                      {filteredPlaces.length === 0 ? (
                        <div className="md:col-span-2 xl:col-span-3 text-center py-16 flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <MapIcon className="w-8 h-8" />
                          </div>
                          <div className="flex flex-col gap-1 px-8">
                            <span className="font-semibold text-slate-800 text-sm">Nessuna tappa salvata</span>
                            <p className="text-xs text-slate-400">
                              Carica uno screenshot o inserisci un link per mappare nuove mete!
                            </p>
                          </div>
                        </div>
                      ) : (
                        filteredPlaces.map((place) => {
  // Configurazione stili e icone in base alla categoria
  // Configurazione stili e illustrazioni in base alla categoria
  const categoryConfig = {
    nature: { borderColor: "border-l-emerald-500", illustration: naturaIllustration },
    food:   { borderColor: "border-l-amber-400",   illustration: foodIllustration },
    sight:  { borderColor: "border-l-sky-500",     illustration: photoIllustration },
  }[place.category] || { borderColor: "border-l-slate-400", illustration: photoIllustration };
  return (
    <div
      key={place.id}
      onClick={() => {
        setSelectedPlaceId(place.id);
        setLayoutMode("map");
      }}
      className={`bg-white rounded-2xl border border-slate-100/80 border-l-[6px] ${categoryConfig.borderColor} shadow-sm hover:shadow-md transition-all flex items-center justify-between p-4 gap-3 shrink-0 cursor-pointer group`}
    >
      {/* Icona Illustrativa del posto */}
      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100 p-2">
  <img src={categoryConfig.illustration} alt="" className="w-full h-full object-contain" />
</div>
    

      {/* Titolo e Descrizione */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h3 className="font-bold text-slate-800 text-sm truncate">
          {place.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {place.description || "Nessuna descrizione."}
        </p>
      </div>

      {/* Striscia di destra con la Freccia */}
      <div className="w-10 h-10 rounded-xl bg-[#F4ECE9] group-hover:bg-[#d64b38] group-hover:text-white text-[#d64b38] transition-all flex items-center justify-center shrink-0">
        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
      </div>
    </div>
  );
})
                      )}
                    </div>
                  )}

                  {/* 🔴 PULSANTE "+" PER AGGIUNGERE UN LUOGO (Visibile sia in Mappa che in Lista) */}
                  {/* 🔴 PULSANTE "+" PER AGGIUNGERE UN LUOGO */}
<button
  onClick={() => setIsAddModalOpen(true)}
  className="fixed bottom-24 right-5 sm:bottom-6 sm:right-6 z-40 bg-[#d64b38] hover:bg-[#c0402e] text-white p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center border border-white/20 cursor-pointer"
  title="Aggiungi Luogo"
>
  <Plus className="w-6 h-6 stroke-[2.5]" />
</button>
                </>
              )}

              {activeTab !== "travel" && (
                <div className="w-full h-full overflow-y-auto p-4 pb-28 flex flex-col gap-4">
                  {filteredOtherLinks.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col gap-1 px-8">
                        <span className="font-semibold text-slate-800 text-sm">Nessun link salvato</span>
                        <p className="text-xs text-slate-400">
                          Salva post utili, articoli di blog, video o ricette da consultare in un click!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredOtherLinks.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 relative hover:shadow-md transition-all shrink-0"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col min-w-0">
                              <h3 className="font-bold text-slate-800 text-sm truncate">{item.title}</h3>
                              {item.link && (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-orange-500 hover:underline inline-flex items-center gap-1 mt-0.5"
                                >
                                  Apri link <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteOtherLink(item.id)}
                              className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pulsante aggiungi per altre categorie */}
                  <button
                    onClick={() => setIsOtherLinkModalOpen(true)}
                    className="fixed bottom-6 right-6 z-40 bg-[#d64b38] hover:bg-[#c0402e] text-white p-4 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center border border-white/20 cursor-pointer"
                    title="Aggiungi Link"
                  >
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALI */}
      {isAddModalOpen && (
        <AddPlaceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddPlace={handleAddPlace}
        />
      )}

      {isOtherLinkModalOpen && (
        <AddOtherLinkModal
          isOpen={isOtherLinkModalOpen}
          onClose={() => setIsOtherLinkModalOpen(false)}
          onAddItem={handleAddOtherLink}
          defaultCategory={activeTab !== "travel" ? activeTab : "ideas"}
        />
      )}

      {editingPlace && (
        <EditPlaceModal
          isOpen={!!editingPlace}
          place={editingPlace}
          onClose={() => setEditingPlace(null)}
          onUpdatePlace={handleUpdatePlace}
        />
      )}
    </div>
  );
}