import { useState, useEffect } from "react";
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
  Navigation,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Info,
  Calendar,
  X,
  FileText
} from "lucide-react";
import { Place, GeneralLinkItem, MainCategory } from "./types";
import MapComponent from "./components/MapComponent";
import AddPlaceModal from "./components/AddPlaceModal";
import AddOtherLinkModal from "./components/AddOtherLinkModal";

// Pre-seeded initial data for Rome travel spots (matching screenshots)
const INITIAL_PLACES: Place[] = [
  {
    id: "rome-1",
    title: "Vicolo di Trastevere",
    description: "Caratteristico vicolo romano rinfrescato dall'edera arrampicata, vespette parcheggiate e sanpietrini storici d'epoca.",
    category: "sight",
    lat: 41.8893,
    lng: 12.4705,
    walkingDirections: "Prendi la linea Tram 8 fino a Piazza Mastai, poi addentrati a piedi per 3 minuti.",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Trastevere+Roma",
    visited: false,
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=500&q=80",
    createdAt: "2026-07-10T12:00:00Z",
    favorite: true
  },
  {
    id: "rome-2",
    title: "La Gatta Buia Pizza",
    description: "Una delle pizzerie e trattorie più rinomate di Trastevere per gustare l'autentica cacio e pepe e pizza romana croccante.",
    category: "food",
    lat: 41.8881,
    lng: 12.4712,
    walkingDirections: "A 5 minuti a piedi da Piazza di Santa Maria in Trastevere.",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=La+Gatta+Buia+Roma",
    visited: false,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
    createdAt: "2026-07-11T14:30:00Z",
    favorite: false
  },
  {
    id: "rome-3",
    title: "Giardino degli Aranci",
    description: "Splendido parco pubblico sull'Aventino che offre una romantica e memorabile vista panoramica su tutta la cupola di San Pietro.",
    category: "nature",
    lat: 41.8848,
    lng: 12.4797,
    walkingDirections: "Sali la collina dell'Aventino partendo dal retro di Bocca della Verità, circa 8 minuti.",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Giardino+degli+Aranci+Roma",
    visited: true,
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80",
    createdAt: "2026-07-09T10:15:00Z",
    favorite: true
  },
  {
    id: "rome-4",
    title: "Bioparco di Roma",
    description: "Giardino zoologico storico situato all'interno della splendida cornice di Villa Borghese, perfetto per passeggiate all'aria aperta.",
    category: "nature",
    lat: 41.9175,
    lng: 12.4862,
    walkingDirections: "Tram 3 o 19, fermata Bioparco, oppure cammina partendo da Piazza del Popolo.",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Bioparco+di+Roma",
    visited: false,
    imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=500&q=80",
    createdAt: "2026-07-12T08:00:00Z",
    favorite: false
  }
];

const INITIAL_OTHER_LINKS: GeneralLinkItem[] = [
  {
    id: "other-1",
    title: "Moodboard arredamento casa rurale",
    link: "https://pinterest.com/design-ideas",
    description: "Idee di palette calde, mattoni a vista, grandi tavoli in rovere e lampade vintage in rame.",
    notes: "Ispirazione per ristrutturare la camera degli ospiti.",
    category: "ideas",
    createdAt: "2026-07-11T10:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "other-2",
    title: "Le città invisibili (Italo Calvino)",
    link: "https://www.goodreads.com/book/show/9803.Invisible_Cities",
    description: "Dialogo poetico tra Marco Polo e Kublai Khan su città fantastiche, sospese e metaforiche.",
    notes: "Da rileggere prima del prossimo viaggio in Asia.",
    category: "books",
    createdAt: "2026-07-10T16:20:00Z",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "other-3",
    title: "La Grande Bellezza - Sorrentino",
    link: "https://www.imdb.com/title/tt2358891/",
    description: "Affascinante passeggiata decadente nella Roma mondana, tra feste sul tetto e passeggiate all'alba sul Tevere.",
    notes: "Oscar miglior film straniero. Fotografia spettacolare.",
    category: "movies",
    createdAt: "2026-07-08T21:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "other-4",
    title: "La vera Carbonara di Roma (GialloZafferano)",
    link: "https://www.giallozafferano.it/ricette/Spaghetti-alla-Carbonara.html",
    description: "Ricetta tradizionale: guanciale romano stagionato, pecorino romano DOP, tuorli d'uovo, pepe nero.",
    notes: "Niente panna! Cuocere il guanciale a fuoco medio senza olio aggiunto.",
    category: "recipes",
    createdAt: "2026-07-12T09:15:00Z",
    imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=300&q=80"
  }
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MainCategory>("travel");
  const [travelSubTab, setTravelSubTab] = useState<"da-visitare" | "visitati">("da-visitare");
  const [layoutMode, setLayoutMode] = useState<"list" | "map">("list");

  // Places and Links State with local persistence
  const [places, setPlaces] = useState<Place[]>(() => {
    const local = localStorage.getItem("travel_places");
    return local ? JSON.parse(local) : INITIAL_PLACES;
  });

  const [otherLinks, setOtherLinks] = useState<GeneralLinkItem[]>(() => {
    const local = localStorage.getItem("travel_other_links");
    return local ? JSON.parse(local) : INITIAL_OTHER_LINKS;
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<"food" | "sight" | "nature" | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOtherLinkModalOpen, setIsOtherLinkModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("travel_places", JSON.stringify(places));
  }, [places]);

  useEffect(() => {
    localStorage.setItem("travel_other_links", JSON.stringify(otherLinks));
  }, [otherLinks]);

  // Handle adding a place from AI Modal
  const handleAddPlace = (newPlace: Omit<Place, "id" | "createdAt" | "visited">) => {
    const place: Place = {
      ...newPlace,
      id: "place-" + Date.now(),
      createdAt: new Date().toISOString(),
      visited: false // Add to "Da visitare" by default
    };
    setPlaces([place, ...places]);
    setClickedCoords(null);
  };

  // Handle adding other general links
  const handleAddOtherLink = (newItem: Omit<GeneralLinkItem, "id" | "createdAt">) => {
    const item: GeneralLinkItem = {
      ...newItem,
      id: "item-" + Date.now(),
      createdAt: new Date().toISOString()
    };
    setOtherLinks([item, ...otherLinks]);
  };

  // Toggle visited status ("Da visitare" <-> "Visitati")
  const handleToggleVisited = (id: string) => {
    setPlaces(places.map(p => p.id === id ? { ...p, visited: !p.visited } : p));
  };

  // Toggle heart favorite
  const handleToggleFavorite = (id: string) => {
    setPlaces(places.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p));
  };

  // Delete travel spot
  const handleDeletePlace = (id: string) => {
    setPlaces(places.filter(p => p.id !== id));
    if (selectedPlaceId === id) setSelectedPlaceId(null);
  };

  // Delete other general link
  const handleDeleteOtherLink = (id: string) => {
    setOtherLinks(otherLinks.filter(item => item.id !== id));
  };

  // Map Click triggers adding a place at exact spot
  const handleMapClickToAdd = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    setIsAddModalOpen(true);
  };

  // Filtered lists computation
  const filteredPlaces = places.filter((place) => {
    // 1. Tab match
    const isTabMatch = travelSubTab === "da-visitare" ? !place.visited : place.visited;
    if (!isTabMatch) return false;

    // 2. Search match
    const matchesSearch =
      place.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.walkingDirections.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // 3. Category match
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
      {/* Container simulating high-fidelity smartphone device, centered beautifully on desktop */}
      <div className="w-full md:max-w-md bg-white md:rounded-[40px] md:shadow-2xl overflow-hidden flex flex-col h-screen md:h-[840px] relative border border-slate-200">
        
        {/* Device camera cutout & speaker mock for premium mobile fidelity */}
        <div className="hidden md:flex justify-center items-center h-6 bg-slate-900 text-[10px] text-slate-400 px-6 justify-between select-none shrink-0 z-40">
          <span className="font-medium text-white/90">09:41</span>
          <div className="w-16 h-4 bg-black rounded-full absolute top-1 left-1/2 -translate-x-1/2" />
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span className="text-white/80 font-semibold uppercase tracking-wider text-[8px]">Live</span>
          </div>
        </div>

        {/* TOP BAR / NAVIGATION (Replicating Screenshots 1, 2, 3, 4) */}
        <div className="bg-white border-b border-slate-100 p-4 pt-5 shrink-0 shadow-sm z-30">
          <div className="flex justify-between items-center mb-4">
            
            {/* Left Title: Airplane icon + "Travel" title */}
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

            {/* Right: List/Map Switch toggle (Only active on "Travel" tab) */}
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

          {/* Sub-Tabs: "Da visitare" & "Visitati" (Only shown when Travel category is active) */}
          {activeTab === "travel" ? (
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
          ) : (
            /* Helpful indicator for other tabs */
            <p className="text-xs text-slate-500 bg-orange-50/50 p-2 rounded-lg border border-orange-100 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-200" />
              Siti e link salvati divisi per categoria
            </p>
          )}
        </div>

        {/* MAIN BODY WORKSPACE (Scrollable lists or map canvas) */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50">
          
          {/* SEARCH BAR (Matching Screenshot 4 "Cerca luogo" design) */}
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

            {/* MAP FILTER CIRCULAR BUTTONS (Screenshot 4 Rome map filters detail) */}
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
                  Tutti ({places.filter(p => travelSubTab === "da-visitare" ? !p.visited : p.visited).length})
                </button>

                <button
                  onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "food" ? null : "food")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 border ${
                    selectedCategoryFilter === "food"
                      ? "bg-amber-400 text-white border-amber-400 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50"
                  }`}
                >
                  <span className="text-xs">🍕</span> Cibo ({places.filter(p => (travelSubTab === "da-visitare" ? !p.visited : p.visited) && p.category === "food").length})
                </button>

                <button
                  onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "sight" ? null : "sight")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 border ${
                    selectedCategoryFilter === "sight"
                      ? "bg-sky-400 text-white border-sky-400 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-sky-50"
                  }`}
                >
                  <span className="text-xs">📸</span> Attrazioni ({places.filter(p => (travelSubTab === "da-visitare" ? !p.visited : p.visited) && p.category === "sight").length})
                </button>

                <button
                  onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "nature" ? null : "nature")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 border ${
                    selectedCategoryFilter === "nature"
                      ? "bg-emerald-400 text-white border-emerald-400 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50"
                  }`}
                >
                  <span className="text-xs">🌳</span> Natura ({places.filter(p => (travelSubTab === "da-visitare" ? !p.visited : p.visited) && p.category === "nature").length})
                </button>
              </div>
            )}
          </div>

          {/* MAIN CONTAINER AREA */}
          <div className="flex-1 relative overflow-hidden">
            
            {/* TRAVEL VIEW */}
            {activeTab === "travel" && (
              layoutMode === "map" ? (
                /* Map View Mode (Screenshot 3 & 4) */
                <div className="w-full h-full">
                  <MapComponent
                    places={filteredPlaces}
                    onToggleVisited={handleToggleVisited}
                    onToggleFavorite={handleToggleFavorite}
                    onDeletePlace={handleDeletePlace}
                    selectedPlaceId={selectedPlaceId}
                    setSelectedPlaceId={setSelectedPlaceId}
                    onMapClick={handleMapClickToAdd}
                  />
                </div>
              ) : (
                /* List View Mode (Screenshot 2 exact style replication) */
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
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex hover:shadow-md transition-all h-[130px]"
                      >
                        {/* Left image - Vespa on Italian street screenshot reproduction */}
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

                        {/* Right Content */}
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

                          {/* Detail Button exactly matches Coral red "Dettaglio" in Screenshots */}
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
                              {/* Delete button */}
                              <button
                                onClick={() => handleDeletePlace(place.id)}
                                className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors"
                                title="Elimina luogo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Replicating Screenshots Red/Coral button "Dettaglio" */}
                              <button
                                onClick={() => {
                                  setSelectedPlaceId(place.id);
                                  setLayoutMode("map"); // Switch layout to map and center
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

            {/* OTHER SAVED LINK CATEGORIES (Ideas, Books, Movies, Recipes) */}
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
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 relative hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-col min-w-0">
                            <h3 className="font-bold text-slate-800 text-sm truncate">{item.title}</h3>
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-orange-500 hover:underline inline-flex items-center gap-1 mt-0.5 truncate"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {new URL(item.link).hostname}
                            </a>
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
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1 px-3 rounded-lg transition-colors cursor-pointer"
                          >
                            Apri Link
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FLOATING ACTION BUTTON (Screenshot 1 & 2 bottom-right Red Coral Button) */}
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

          </div>

        </div>

        {/* BOTTOM NAVIGATION BAR (Screenshots Solid Red/Coral Bar with 5 tabs) */}
        <div className="bg-[#d64b38] py-3.5 px-4 flex justify-around items-center shrink-0 z-40 shadow-xl border-t border-orange-700/20 select-none">
          
          {/* 1. Travel (Airplane) */}
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

          {/* 2. Ideas (Pencil/Ruler) */}
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

          {/* 3. Books (Books / Reading) */}
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

          {/* 4. Film (Film reel) */}
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

          {/* 5. Chef (Chef hat) */}
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

      {/* MODALS */}
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
