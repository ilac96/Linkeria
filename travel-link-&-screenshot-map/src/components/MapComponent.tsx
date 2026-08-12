import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Place } from "../types";
import { Heart, X, Navigation, ExternalLink, Pencil, Trash2 } from "lucide-react";
import foodIllustration from "./illustrations/food.svg";
import naturaIllustration from "./illustrations/natura.svg";
import photoIllustration from "./illustrations/photo.svg";

interface MapComponentProps {
  places: Place[];
  onToggleVisited: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeletePlace: (id: string) => void;
  onEditPlace: (place: Place) => void;   // ⬅️ aggiungi questa riga
  selectedPlaceId: string | null;
  setSelectedPlaceId: (id: string | null) => void;
}

export default function MapComponent({
  places,
  onToggleVisited,
  onToggleFavorite,
  onDeletePlace,
  onEditPlace,   // ⬅️ aggiungi questa riga
  selectedPlaceId,
  setSelectedPlaceId,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
const isFirstLoadRef = useRef(true);
const prevPlaceCountRef = useRef(places.length);
  
  // Track selected place in map state
  const activePlace = places.find((p) => p.id === selectedPlaceId) || null;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Rome coordinates as default center
    const defaultCenter: L.LatLngTuple = [41.8902, 12.4922];
    const defaultZoom = 13;

    // Create Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false, // Custom position below
    });

    // Add beautiful clean map tiles (CartoDB Positron is very clean and matches the light theme in screenshot)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Add Zoom Control on the top-right
    L.control.zoom({ position: "topright" }).addTo(map);

   // Click on map (outside markers) just deselects the active place
map.on("click", (e: L.LeafletMouseEvent) => {
  if ((e.originalEvent.target as HTMLElement).closest(".leaflet-marker-icon")) {
    return;
  }
  setSelectedPlaceId(null);
});

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers when places array changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers from map
    const currentMarkers = markersRef.current;
    Object.keys(currentMarkers).forEach((key) => {
      const marker = currentMarkers[key];
      if (marker) {
        marker.remove();
      }
    });
    markersRef.current = {};

    // Add new markers
    places.forEach((place) => {
      // Determine marker color and emoji based on category
      let bgClass = "bg-amber-400";
      let emoji = "🍕";
      if (place.category === "sight") {
        bgClass = "bg-sky-400";
        emoji = "📸";
      } else if (place.category === "nature") {
        bgClass = "bg-emerald-400";
        emoji = "🌳";
      }

      // Create a beautiful HTML div icon
      const customIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center group">
            <div class="w-9 h-9 rounded-full ${bgClass} border-2 border-white shadow-lg flex items-center justify-center text-base transform transition-all duration-200 hover:scale-125 hover:z-[1000]">
              ${emoji}
            </div>
            <div class="bg-slate-900/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow mt-1 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
              ${place.title}
            </div>
          </div>
        `,
        className: "custom-leaflet-marker",
        iconSize: [36, 48],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([place.lat, place.lng], { icon: customIcon }).addTo(map);
      
      marker.on("click", () => {
        setSelectedPlaceId(place.id);
        map.setView([place.lat, place.lng], map.getZoom() < 15 ? 15 : map.getZoom(), {
          animate: true,
          duration: 0.5,
        });
      });

      markersRef.current[place.id] = marker;
    });

    // Fit bounds SOLO al primo caricamento o se cambia il numero di luoghi
    const countChanged = places.length !== prevPlaceCountRef.current;
    if (places.length > 0 && (isFirstLoadRef.current || countChanged)) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.15));
      isFirstLoadRef.current = false;
    }
    prevPlaceCountRef.current = places.length;
  }, [places]);

  // Center map on selected place
  useEffect(() => {
    const map = mapRef.current;

    const place = places.find((p) => p.id === selectedPlaceId);
    if (place) {
      map.setView([place.lat, place.lng], 15, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [selectedPlaceId]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden shadow-inner border border-slate-100">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

     {/* Detail Overlay Card */}
{activePlace && (
  <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">

    {/* Close Button — in overlay, sopra tutto il resto della card */}
    <button
      onClick={() => setSelectedPlaceId(null)}
      className="absolute top-3 right-3 z-10 p-2 rounded-full border border-slate-200 bg-white/90 backdrop-blur-sm text-slate-500 hover:bg-white transition-all shadow-sm"
      title="Chiudi dettagli"
    >
      <X className="w-4 h-4" />
    </button>

    <div className="p-4 flex flex-col gap-2">
      {/* Category + Stato riga in alto */}
      <div className="flex justify-between items-center gap-2 pr-9">
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm text-white ${
  activePlace.category === "food" ? "bg-amber-400" :
  activePlace.category === "sight" ? "bg-sky-400" : "bg-emerald-400"
}`}>
  {activePlace.category === "food" ? "Cibo / Ristorante" :
   activePlace.category === "sight" ? "Attrazione / Vista" : "Parco / Natura"}
</span>
          
        
        
        <button
          onClick={() => onToggleVisited(activePlace.id)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full shadow-sm transition-all shrink-0 ${
            activePlace.visited
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {activePlace.visited ? "✓ Visitato" : "Da visitare"}
        </button>
      </div>

      <div className="flex justify-between items-start mt-1">
        <h3 className="text-lg font-bold text-slate-800">{activePlace.title}</h3>
        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded shrink-0 ml-2">
          {activePlace.lat.toFixed(4)}, {activePlace.lng.toFixed(4)}
        </span>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        {activePlace.description}
      </p>

      {/* Footer: link mappa a sinistra, Heart + Pencil + Trash2 a destra */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
        <a
          href={activePlace.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1 underline decoration-orange-300"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Link a Mappa
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(activePlace.id)}
            className={`p-2 rounded-full border transition-all ${
              activePlace.favorite
                ? "bg-red-50 text-red-500 border-red-200"
                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
            }`}
            title="Aggiungi ai preferiti"
          >
            <Heart className={`w-4 h-4 ${activePlace.favorite ? "fill-current" : ""}`} />
          </button>

          <button
  onClick={() => {
    onEditPlace(activePlace);
    setSelectedPlaceId(null);
  }}
  className="p-2 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
  title="Modifica luogo"
>
  <Pencil className="w-4 h-4" />
</button>

          <button
            onClick={() => {
              onDeletePlace(activePlace.id);
              setSelectedPlaceId(null);
            }}
            className="p-2 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            title="Elimina luogo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}