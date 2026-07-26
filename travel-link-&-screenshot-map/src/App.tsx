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
  Calendar,
  X,
  FileText
} from "lucide-react";
import { Place, GeneralLinkItem, MainCategory } from "./types";
import MapComponent from "./components/MapComponent";
import AddPlaceModal from "./components/AddPlaceModal";
import AddOtherLinkModal from "./components/AddOtherLinkModal";


// ============================================================
// FUNZIONI DI CONVERSIONE tra le righe della tabella "links" su Supabase
// e i tipi usati internamente dall'app (Place, GeneralLinkItem).
// Prima erano in un file separato (lib/supabaseMappers.ts), le ho
// spostate qui dentro per evitare problemi di cartelle/import.
// ============================================================

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
  return {
    id: row.id,
    title: row.title,
    description: meta.description || "",
    category: (meta.subcategory as "food" | "sight" | "nature") || "sight",
    lat: typeof meta.lat === "number" ? meta.lat : 0,
    lng: typeof meta.lng === "number" ? meta.lng : 0,
    walkingDirections: meta.walkingDirections || "",
    mapUrl: row.original_url || meta.mapUrl || "",
    visited: row.status === "visited",
    imageUrl: row.image_url || "",
    createdAt: row.created_at,
    favorite: !!meta.favorite,
  };
}

function placeToInsertRow(place: Omit<Place, "id" | "createdAt" | "visited">) {
  return {
    category: "travel",
    source_type: "manual",
    title: place.title,
    original_url: place.mapUrl || null,
    image_url: place.imageUrl || null,
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

  // Dati caricati da Supabase (partono vuoti, si popolano dopo il fetch)
  const [places, setPlaces] = useState<Place[]>([]);
  const [otherLinks, setOtherLinks] = useState<GeneralLinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<"food" | "sight" | "nature" | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOtherLinkModalOpen, setIsOtherLinkModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ---------- CARICAMENTO DATI DA SUPABASE ----------
  // Una sola tabella "links": leggiamo tutto e dividiamo lato client
  // tra "travel" (-> places) e tutto il resto (-> otherLinks).
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

        const travelRows = rows.filter((r) => r.category === "travel");
        const otherRows = rows.filter((r) => r.category !== "travel");

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

  // ---------- AGGIUNTA DI UN NUOVO LINK (IDEE / LIBRI / FILM / RICETTE) ----------
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

  // ---------- TOGGLE VISITATO ("Da visitare" <-> "Visitati") ----------
  const handleToggleVisited = async (id: string) => {
    const place = places.find((p) => p.id === id);
    if (!place) return;
    const nuovoStatus = place.visited ? "to_visit" : "visited";

    // Aggiorniamo subito la UI (ottimistico), poi confermiamo su Supabase
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

  // ---------- ELIMINA POSTO (VIAGGI) ----------
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

  // Click sulla mappa apre il modale per aggiungere un posto in quel punto
  const handleMapClickToAdd = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    setIsAddModalOpen(true);
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:py-8 md:px-4 items-center justify-start">
      <div className="w-full md:max-w-md bg-white md:rounded-[40px] md:shadow-2xl overflow-hidden flex flex-col h-screen md:h-[840px] relative border border-slate-200">

        <div className="hidden md:flex justify-center items-center h-6 bg-slate-900 text-[10px] text-slate-400 px-6 justify-between select-none shrink-0 z-40">
          <span className="font-medium text-white/90">09:41</span>
          <div className="w-16 h-4 bg-black rounded-full absolute top-1 left-1/2 -translate-x-1/2" />
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span className="text-white/80 font-semibold uppercase tracking-wider text-[8px]">Live</span>
          </div>
        </div>

        <div className="bg-white border-b border-slate-100 p-4 pt-5 shrink-0 shadow-sm z-30">
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
            <div className="relative">
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
              layoutMode === "map" ? (
                <div className="w-full h-full">
                  <MapComponent
                    places={filteredPlaces}
                    onToggleVisited={handleToggleVisited}
                    onToggleFavorite={handleToggleFavorite}
                    onDeletePlace={handleDeletePlace}
                    selectedPlaceId={selectedPlaceId}
                    setSelectedPlaceId={setSelectedPlaceId}
                    
                  />
                </div>
              ) : (
                <div className="w-full h-full overflow-y-auto p-4 flex flex-col gap-4">
                  {filteredPlaces.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <MapIcon className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col gap-1 px-8">
                        <span className="font-semibold text-slate-800 text-sm">Nessuna tappa salvata</span>
                        <p className="text-xs text-slate-400">
                          Carica uno screenshot di Instagram/TikTok o inserisci un link per mappare nuove mete!
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredPlaces.map((place) => (
                      <div
  key={place.id}
  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex hover:shadow-md transition-all h-[130px] shrink-0"
>
                        <div className="w-1/3 min-w-[100px] h-full relative bg-slate-100 shrink-0">
                          <img
                            src={place.imageUrl}
                            alt={place.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => handleToggleFavorite(place.id)}
                            className="absolute top-2 left-2 p-1 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-red-500 hover:bg-white transition-all scale-95"
                          >
                            <Heart className={`w-3.5 h-3.5 ${place.favorite ? "fill-current" : ""}`} />
                          </button>
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-start gap-1">
                              <h3 className="font-bold text-slate-800 text-sm truncate">{place.title}</h3>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                                place.category === "food" ? "bg-amber-100 text-amber-700" :
                                place.category === "sight" ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {place.category === "food" ? "Cibo" : place.category === "sight" ? "Attrazione" : "Natura"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {place.description}
                            </p>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleVisited(place.id)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
                                  place.visited
                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {place.visited ? "✓ Visitato" : "Visita"}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeletePlace(place.id)}
                                className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors"
                                title="Elimina luogo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedPlaceId(place.id);
                                  setLayoutMode("map");
                                }}
                                className="bg-[#d64b38] hover:bg-[#c0402e] text-white text-[11px] font-bold px-3.5 py-1 rounded-lg transition-colors shadow-sm cursor-pointer"
                              >
                                Dettaglio
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            )}

            {activeTab !== "travel" && (
              <div className="w-full h-full overflow-y-auto p-4 flex flex-col gap-4">
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
                  <div className="grid grid-cols-1 gap-4">
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
                                className="text-[10px] text-orange-500 hover:underline inline-flex items-center gap-1 mt-0.5 truncate"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {(() => {
                                  try {
                                    return new URL(item.link).hostname;
                                  } catch {
                                    return item.link;
                                  }
                                })()}
                              </a>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteOtherLink(item.id)}
                            className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors shrink-0"
                            title="Elimina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        {item.notes && (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-600">
                            <span className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">I miei appunti</span>
                            {item.notes}
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-50 pt-2.5 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                          </span>
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1 px-3 rounded-lg transition-colors cursor-pointer"
                            >
                              Apri Link
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!(activeTab === "travel" && layoutMode === "map" && selectedPlaceId) && (
  <button
    onClick={() => {
      setClickedCoords(null);
      if (activeTab === "travel") {
        setIsAddModalOpen(true);
      } else {
        setIsOtherLinkModalOpen(true);
      }
    }}
    className="absolute bottom-4 right-4 bg-[#d64b38] hover:bg-[#c0402e] active:scale-95 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all hover:rotate-90 duration-300 z-30 cursor-pointer"
    title={activeTab === "travel" ? "Aggiungi posto" : "Salva link"}
  >
    <Plus className="w-6 h-6 stroke-[3px]" />
  </button>
)}
          </div>
        </div>

        <div className="bg-[#d64b38] py-3.5 px-4 flex justify-around items-center shrink-0 z-40 shadow-xl border-t border-orange-700/20 select-none">
          <button
            onClick={() => setActiveTab("travel")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "travel"
                ? "text-white scale-110 font-bold"
                : "text-orange-200 hover:text-white hover:scale-105"
            }`}
          >
            <Plane className={`w-5.5 h-5.5 ${activeTab === "travel" ? "fill-white/10" : ""}`} />
            <span className="text-[9px] tracking-wide">Viaggi</span>
          </button>

          <button
            onClick={() => setActiveTab("ideas")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "ideas"
                ? "text-white scale-110 font-bold"
                : "text-orange-200 hover:text-white hover:scale-105"
            }`}
          >
            <PenTool className="w-5.5 h-5.5" />
            <span className="text-[9px] tracking-wide">Idee</span>
          </button>

          <button
            onClick={() => setActiveTab("books")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "books"
                ? "text-white scale-110 font-bold"
                : "text-orange-200 hover:text-white hover:scale-105"
            }`}
          >
            <BookOpen className={`w-5.5 h-5.5 ${activeTab === "books" ? "fill-white/10" : ""}`} />
            <span className="text-[9px] tracking-wide">Libri</span>
          </button>

          <button
            onClick={() => setActiveTab("movies")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "movies"
                ? "text-white scale-110 font-bold"
                : "text-orange-200 hover:text-white hover:scale-105"
            }`}
          >
            <Film className="w-5.5 h-5.5" />
            <span className="text-[9px] tracking-wide">Film & Video</span>
          </button>

          <button
            onClick={() => setActiveTab("recipes")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "recipes"
                ? "text-white scale-110 font-bold"
                : "text-orange-200 hover:text-white hover:scale-105"
            }`}
          >
            <ChefHat className="w-5.5 h-5.5" />
            <span className="text-[9px] tracking-wide">Ricette</span>
          </button>
        </div>
      </div>

      <AddPlaceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setClickedCoords(null);
        }}
        onAddPlace={handleAddPlace}
        clickedCoords={clickedCoords}
      />

      <AddOtherLinkModal
        isOpen={isOtherLinkModalOpen}
        onClose={() => setIsOtherLinkModalOpen(false)}
        onAddItem={handleAddOtherLink}
        defaultCategory={activeTab}
      />
    </div>
  );
}