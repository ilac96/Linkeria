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
  Utensils,
  Camera,
  Trees,
  ChevronRight,
  Bookmark,
  CheckCircle2
} from "lucide-react";
import { Place, GeneralLinkItem, BookItem, MainCategory } from "./types";
import MapComponent from "./components/MapComponent";
import AddPlaceModal from "./components/AddPlaceModal";
import AddOtherLinkModal from "./components/AddOtherLinkModal";
import EditPlaceModal from "./components/EditPlaceModal";
import AddBookModal from "./components/AddBookModal";
import EditBookModal from "./components/EditBookModal";
import BookDetailModal from "./components/BookDetailModal";
import BookPickSection from "./components/BookPickSection";
import { ItalianFlagBadge, WorldGlobeBadge } from "./components/BookBadges";
import foodIllustration from "./components/illustrations/food.svg";
import naturaIllustration from "./components/illustrations/natura.svg";
import photoIllustration from "./components/illustrations/photo.svg";

const categoryConfig = {
  nature: { borderColor: "border-l-emerald-500", illustration: naturaIllustration },
  food:   { borderColor: "border-l-amber-400",   illustration: foodIllustration },
  sight:  { borderColor: "border-l-sky-500",     illustration: photoIllustration },
};

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

const DEFAULT_INITIAL_BOOKS: BookItem[] = [
  {
    id: "sample-book-1",
    title: "Il nome della rosa",
    author: "Umberto Eco",
    description: "Un misterioso giallo ambientato in un'abbazia medievale benedettina tra filosofia e segreti.",
    language: "italian",
    read: false,
    favorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-book-2",
    title: "1984",
    author: "George Orwell",
    description: "Un capolavoro distopico sul controllo mentale, la sorveglianza totale e la resistenza umana.",
    language: "international",
    read: false,
    favorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-book-3",
    title: "L'amica geniale",
    author: "Elena Ferrante",
    description: "L'epopea intima e vibrante dell'amicizia tra due bambine nella Napoli del dopoguerra.",
    language: "italian",
    read: false,
    favorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-book-4",
    title: "Cento anni di solitudine",
    author: "Gabriel García Márquez",
    description: "La vertiginosa e leggendaria saga generazionale della famiglia Buendía a Macondo.",
    language: "international",
    read: false,
    favorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-book-5",
    title: "Se questo è un uomo",
    author: "Primo Levi",
    description: "La testimonianza limpida e indimenticabile della dignità umana sopravvissuta ad Auschwitz.",
    language: "italian",
    read: true,
    favorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-book-6",
    title: "Il Grande Gatsby",
    author: "F. Scott Fitzgerald",
    description: "Lo sfarzo illusorio, l'ossessione romantica e la tragedia nei ruggenti anni Venti a New York.",
    language: "international",
    read: true,
    favorite: false,
    createdAt: new Date().toISOString(),
  },
];

function rowToPlace(row: LinksRow): Place {
  const meta = row.metadata || {};
  const validSubcategories = ["food", "sight", "nature"];
  const subcategory = meta.subcategory || (validSubcategories.includes(row.category) ? row.category : "sight");

  let validImageUrl = row.image_url || meta.imageUrl || "";
  if (validImageUrl.startsWith("data:image/") && validImageUrl.length > 50000) {
    validImageUrl = "";
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

function rowToBook(row: LinksRow): BookItem {
  const meta = row.metadata || {};
  return {
    id: row.id,
    title: row.title || "Libro senza titolo",
    author: meta.author || row.notes || "Autore",
    description: meta.description || "Descrizione breve.",
    language: (meta.language as "italian" | "international") || "italian",
    read: row.status === "read" || row.status === "visited",
    link: row.original_url || "",
    imageUrl: row.image_url || "",
    notes: meta.userNotes || "",
    favorite: !!meta.favorite,
    createdAt: row.created_at,
  };
}

function bookToInsertRow(book: Omit<BookItem, "id" | "createdAt">) {
  return {
    category: "books",
    source_type: "manual",
    title: book.title,
    original_url: book.link || null,
    image_url: book.imageUrl || null,
    notes: book.author || null,
    status: book.read ? "read" : "to_read",
    metadata: {
      author: book.author,
      language: book.language,
      description: book.description,
      userNotes: book.notes || null,
      favorite: book.favorite || false,
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

  // Books specific state (matching the uploaded mockups)
  const [booksSubTab, setBooksSubTab] = useState<"da-leggere" | "letti">("da-leggere");
  const [booksLayoutMode, setBooksLayoutMode] = useState<"list" | "pick">("list");
  const [selectedBookLanguageFilter, setSelectedBookLanguageFilter] = useState<"italian" | "international" | null>(null);
  const [activeDetailBook, setActiveDetailBook] = useState<BookItem | null>(null);
  const [shuffleCategoryContext, setShuffleCategoryContext] = useState<"italian" | "international" | "all">("all");
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  // Data collections loaded from Supabase or memory
  const [places, setPlaces] = useState<Place[]>([]);
  const [books, setBooks] = useState<BookItem[]>(DEFAULT_INITIAL_BOOKS);
  const [otherLinks, setOtherLinks] = useState<GeneralLinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Place
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

        if (error) {
          console.warn("Supabase load notice (using initial data if offline):", error.message);
          return;
        }

        const rows = (data || []) as LinksRow[];
        const travelCategories = ["travel", "food", "sight", "nature"];

        const travelRows = rows.filter(
          (r) => travelCategories.includes(r.category) || r.metadata?.subcategory
        );
        
        const bookRows = rows.filter((r) => r.category === "books" || r.category === "book");

        const otherRows = rows.filter(
          (r) =>
            !travelCategories.includes(r.category) &&
            !r.metadata?.subcategory &&
            r.category !== "books" &&
            r.category !== "book"
        );

        if (travelRows.length > 0) {
          setPlaces(travelRows.map(rowToPlace));
        }
        if (bookRows.length > 0) {
          setBooks(bookRows.map(rowToBook));
        }
        if (otherRows.length > 0) {
          setOtherLinks(otherRows.map(rowToOtherLink));
        }
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
        Caricamento in corso...
      </div>
    );
  }

  // ---------- GESTIONE LUOGHI (TRAVEL) ----------
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

      await supabase
        .from("links")
        .update({
          title: updatedPlace.title,
          image_url: updatedPlace.imageUrl || null,
          metadata: updatedMetadata,
        })
        .eq("id", updatedPlace.id);

      setEditingPlace(null);
    } catch (err) {
      console.error("Errore imprevisto:", err);
    }
  };

  const handleAddPlace = async (newPlace: Omit<Place, "id" | "createdAt" | "visited">) => {
    try {
      const rowToInsert = placeToInsertRow(newPlace);
      const { data, error } = await supabase
        .from("links")
        .insert([rowToInsert])
        .select();

      if (!error && data && data.length > 0) {
        const inserted = rowToPlace(data[0] as LinksRow);
        setPlaces([inserted, ...places]);
      } else {
        const fallbackPlace: Place = {
          id: `local-${Date.now()}`,
          title: newPlace.title,
          description: newPlace.description,
          category: newPlace.category,
          lat: newPlace.lat,
          lng: newPlace.lng,
          walkingDirections: newPlace.walkingDirections,
          mapUrl: newPlace.mapUrl,
          visited: false,
          imageUrl: newPlace.imageUrl || "",
          createdAt: new Date().toISOString(),
          favorite: newPlace.favorite,
        };
        setPlaces([fallbackPlace, ...places]);
      }

      setClickedCoords(null);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
    }
  };

  const handleToggleVisited = async (id: string) => {
    const place = places.find((p) => p.id === id);
    if (!place) return;
    const nuovoStatus = place.visited ? "to_visit" : "visited";

    setPlaces(places.map((p) => (p.id === id ? { ...p, visited: !p.visited } : p)));

    await supabase
      .from("links")
      .update({ status: nuovoStatus })
      .eq("id", id);
  };

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

    await supabase
      .from("links")
      .update({ metadata: nuovoMetadata })
      .eq("id", id);
  };

  const handleDeletePlace = async (id: string) => {
    setPlaces(places.filter((p) => p.id !== id));
    if (selectedPlaceId === id) setSelectedPlaceId(null);
    await supabase.from("links").delete().eq("id", id);
  };

  // ---------- GESTIONE LIBRI (BOOKS) ----------
  const handleAddBook = async (newBook: Omit<BookItem, "id" | "createdAt">) => {
    try {
      const rowToInsert = bookToInsertRow(newBook);
      const { data, error } = await supabase
        .from("links")
        .insert([rowToInsert])
        .select();

      if (!error && data && data.length > 0) {
        const inserted = rowToBook(data[0] as LinksRow);
        setBooks([inserted, ...books]);
      } else {
        const fallbackBook: BookItem = {
          id: `book-${Date.now()}`,
          title: newBook.title,
          author: newBook.author,
          description: newBook.description,
          language: newBook.language,
          read: newBook.read,
          link: newBook.link,
          imageUrl: newBook.imageUrl,
          notes: newBook.notes,
          favorite: newBook.favorite,
          createdAt: new Date().toISOString(),
        };
        setBooks([fallbackBook, ...books]);
      }
      setIsAddBookModalOpen(false);
    } catch (err) {
      console.error("Errore salvataggio libro:", err);
    }
  };

  const handleUpdateBook = async (updatedBook: BookItem) => {
    setBooks(books.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    if (activeDetailBook?.id === updatedBook.id) {
      setActiveDetailBook(updatedBook);
    }

    try {
      const updatedMetadata = {
        author: updatedBook.author,
        language: updatedBook.language,
        description: updatedBook.description,
        userNotes: updatedBook.notes || null,
        favorite: updatedBook.favorite || false,
      };

      await supabase
        .from("links")
        .update({
          title: updatedBook.title,
          original_url: updatedBook.link || null,
          image_url: updatedBook.imageUrl || null,
          notes: updatedBook.author || null,
          status: updatedBook.read ? "read" : "to_read",
          metadata: updatedMetadata,
        })
        .eq("id", updatedBook.id);
    } catch (err) {
      console.error("Errore aggiornamento libro:", err);
    }
  };

  const handleToggleBookRead = async (id: string) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    const nextRead = !book.read;
    const nextBook = { ...book, read: nextRead };

    setBooks(books.map((b) => (b.id === id ? nextBook : b)));
    if (activeDetailBook?.id === id) {
      setActiveDetailBook(nextBook);
    }

    await supabase
      .from("links")
      .update({ status: nextRead ? "read" : "to_read" })
      .eq("id", id);
  };

  const handleToggleBookFavorite = async (id: string) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    const nextFav = !book.favorite;
    const nextBook = { ...book, favorite: nextFav };

    setBooks(books.map((b) => (b.id === id ? nextBook : b)));
    if (activeDetailBook?.id === id) {
      setActiveDetailBook(nextBook);
    }

    await supabase
      .from("links")
      .update({
        metadata: {
          author: book.author,
          language: book.language,
          description: book.description,
          userNotes: book.notes || null,
          favorite: nextFav,
        },
      })
      .eq("id", id);
  };

  const handleDeleteBook = async (id: string) => {
    setBooks(books.filter((b) => b.id !== id));
    if (activeDetailBook?.id === id) setActiveDetailBook(null);
    await supabase.from("links").delete().eq("id", id);
  };

  // ---------- SHUFFLE / PICK A BOOK ----------
  const handlePickBook = (category: "italian" | "international" | "all") => {
    setShuffleCategoryContext(category);
    const toRead = books.filter((b) => !b.read);

    let candidates = toRead;
    if (category !== "all") {
      candidates = toRead.filter((b) => b.language === category);
    }

    if (candidates.length === 0) {
      // Fallback: if no books in chosen language, check if any unread exist at all
      if (toRead.length > 0) {
        candidates = toRead;
      } else {
        // Prompt user to add a book
        setIsAddBookModalOpen(true);
        return;
      }
    }

    // Filter out current book if more than 1 available to ensure a fresh pick on each shuffle
    let pool = candidates;
    if (candidates.length > 1 && activeDetailBook) {
      const remaining = candidates.filter((b) => b.id !== activeDetailBook.id);
      if (remaining.length > 0) pool = remaining;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    setActiveDetailBook(pool[randomIndex]);
  };

  // ---------- GESTIONE ALTRI LINK (IDEE, FILM, RICETTE) ----------
  const handleAddOtherLink = async (newItem: Omit<GeneralLinkItem, "id" | "createdAt">) => {
    try {
      const rowToInsert = otherLinkToInsertRow(newItem);
      const { data, error } = await supabase
        .from("links")
        .insert([rowToInsert])
        .select();

      if (!error && data && data.length > 0) {
        const inserted = rowToOtherLink(data[0] as LinksRow);
        setOtherLinks([inserted, ...otherLinks]);
      } else {
        const fallback: GeneralLinkItem = {
          id: `link-${Date.now()}`,
          title: newItem.title,
          link: newItem.link,
          description: newItem.description,
          notes: newItem.notes,
          category: newItem.category,
          createdAt: new Date().toISOString(),
          imageUrl: newItem.imageUrl,
        };
        setOtherLinks([fallback, ...otherLinks]);
      }
      setIsOtherLinkModalOpen(false);
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
    }
  };

  const handleDeleteOtherLink = async (id: string) => {
    setOtherLinks(otherLinks.filter((item) => item.id !== id));
    await supabase.from("links").delete().eq("id", id);
  };

  // ---------- FILTRI LISTE ----------
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

  const filteredBooks = books.filter((book) => {
    const isTabMatch = booksSubTab === "da-leggere" ? !book.read : book.read;
    if (!isTabMatch) return false;

    if (selectedBookLanguageFilter && book.language !== selectedBookLanguageFilter) {
      return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.description.toLowerCase().includes(q) ||
      (book.notes && book.notes.toLowerCase().includes(q))
    );
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
            <Plane className="w-6 h-6 stroke-[2.2]" />
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
            <PenTool className="w-6 h-6 stroke-[2.2]" />
          </button>

          <button
            onClick={() => setActiveTab("books")}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
              activeTab === "books"
                ? "bg-white/20 text-white scale-110"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            title="Books"
          >
            <BookOpen className="w-6 h-6 stroke-[2.2]" />
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
            <Film className="w-6 h-6 stroke-[2.2]" />
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
            <ChefHat className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>

        {/* CONTENUTO PRINCIPALE */}
        <div className="flex-1 flex flex-col min-w-0 h-full">

          {/* HEADER PRINCIPALE */}
          <div className="bg-white border-b border-slate-100 p-4 pt-5 md:pt-4 shrink-0 shadow-xs z-30">
            <div className="flex justify-between items-center mb-3">
              {/* Titolo e Icona Sezione */}
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-50 rounded-xl text-[#d64b38]">
                  {activeTab === "travel" && <Plane className="w-5 h-5 fill-current transform -rotate-12" />}
                  {activeTab === "ideas" && <PenTool className="w-5 h-5" />}
                  {activeTab === "books" && <BookOpen className="w-5 h-5 stroke-[2.4]" />}
                  {activeTab === "movies" && <Film className="w-5 h-5" />}
                  {activeTab === "recipes" && <ChefHat className="w-5 h-5" />}
                </div>
                <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight">
                  {activeTab === "travel" && "Travel"}
                  {activeTab === "ideas" && "Idee"}
                  {activeTab === "books" && "Books"}
                  {activeTab === "movies" && "Film & Video"}
                  {activeTab === "recipes" && "Ricette"}
                </h1>
              </div>

              {/* Toggle Switch in alto a destra per Travel (Lista vs Mappa) */}
              {activeTab === "travel" && (
                <div className="flex bg-[#FAF6F4] p-1 rounded-2xl border border-[#d64b38]/30 shadow-xs">
                  <button
                    onClick={() => {
                      setLayoutMode("list");
                      setSelectedPlaceId(null);
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      layoutMode === "list"
                        ? "bg-[#d64b38] text-white shadow-xs font-semibold scale-105"
                        : "text-[#d64b38] hover:bg-[#d64b38]/10"
                    }`}
                    title="Layout Lista"
                  >
                    <ListIcon className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => setLayoutMode("map")}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      layoutMode === "map"
                        ? "bg-[#d64b38] text-white shadow-xs font-semibold scale-105"
                        : "text-[#d64b38] hover:bg-[#d64b38]/10"
                    }`}
                    title="Layout Mappa"
                  >
                    <MapIcon className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              )}

              {/* Toggle Switch in alto a destra per Books (Lista vs Scegli Libro / Shuffle Deck) - Matching user mockups */}
              {activeTab === "books" && (
                <div className="flex bg-[#FAF6F4] p-1 rounded-2xl border border-[#d64b38]/30 shadow-xs">
                  <button
                    onClick={() => {
                      setBooksLayoutMode("list");
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      booksLayoutMode === "list"
                        ? "bg-[#d64b38] text-white shadow-xs font-semibold scale-105"
                        : "text-[#d64b38] hover:bg-[#d64b38]/10"
                    }`}
                    title="Lista Libri"
                  >
                    <ListIcon className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => {
                      setBooksLayoutMode("pick");
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      booksLayoutMode === "pick"
                        ? "bg-[#d64b38] text-white shadow-xs font-semibold scale-105"
                        : "text-[#d64b38] hover:bg-[#d64b38]/10"
                    }`}
                    title="Pesca un Libro (Trova prossimo libro)"
                  >
                    <MapIcon className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>

            {/* Sotto-tab: Da visitare/leggere vs Visitati/letti */}
            {activeTab === "travel" && layoutMode === "list" ? (
              <div className="flex border-b border-slate-200 text-center">
                <button
                  onClick={() => {
                    setTravelSubTab("da-visitare");
                    setSelectedPlaceId(null);
                  }}
                  className={`flex-1 pb-2.5 text-sm font-medium transition-all relative cursor-pointer ${
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
                  className={`flex-1 pb-2.5 text-sm font-medium transition-all relative cursor-pointer ${
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
            ) : activeTab === "books" && booksLayoutMode === "list" ? (
              /* Books Tab Sub-Header (matching Libri.jpg & Libri letti.jpg) */
              <div className="flex border-b border-slate-200 text-center">
                <button
                  onClick={() => setBooksSubTab("da-leggere")}
                  className={`flex-1 pb-2.5 text-sm font-medium transition-all relative cursor-pointer ${
                    booksSubTab === "da-leggere"
                      ? "text-[#d64b38] font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Da leggere
                  {booksSubTab === "da-leggere" && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d64b38] rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setBooksSubTab("letti")}
                  className={`flex-1 pb-2.5 text-sm font-medium transition-all relative cursor-pointer ${
                    booksSubTab === "letti"
                      ? "text-[#d64b38] font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Letti
                  {booksSubTab === "letti" && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d64b38] rounded-full" />
                  )}
                </button>
              </div>
            ) : activeTab === "travel" ? (
              <p className="text-xs text-slate-500 bg-sky-50/50 p-2 rounded-lg border border-sky-100 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 fill-sky-200" />
                Tutti i luoghi sono visibili sulla mappa
              </p>
            ) : activeTab === "books" && booksLayoutMode === "pick" ? null : (
              <p className="text-xs text-slate-500 bg-orange-50/50 p-2 rounded-lg border border-orange-100 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#d64b38]" />
                Siti e link salvati divisi per categoria
              </p>
            )}
          </div>

          {/* AREA DI CONTENUTO PRINCIPALE */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50">
            
            {/* Barra di ricerca e filtri (visibile quando si è in modalità lista) */}
            {!(activeTab === "books" && booksLayoutMode === "pick") && !(activeTab === "travel" && layoutMode === "map") && (
              <div className="p-3 bg-white border-b border-slate-100 flex flex-col gap-2 shrink-0 shadow-xs z-10">
                <div className="relative md:max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      activeTab === "travel"
                        ? "Cerca luogo..."
                        : activeTab === "books"
                        ? "Cerca titolo, autore o genere..."
                        : "Cerca link salvato..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#d64b38] focus:border-transparent transition-all"
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

                {/* Filtri categoria per Travel */}
                {activeTab === "travel" && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Filtra:</span>
                    <button
                      onClick={() => setSelectedCategoryFilter(null)}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all shrink-0 border cursor-pointer ${
                        selectedCategoryFilter === null
                          ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Tutti ({places.filter((p) => (travelSubTab === "da-visitare" ? !p.visited : p.visited)).length})
                    </button>

                    <button
                      onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "food" ? null : "food")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 border cursor-pointer ${
                        selectedCategoryFilter === "food"
                          ? "bg-amber-400 text-white border-amber-400 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50"
                      }`}
                    >
                      <span className="text-xs">🍕</span> Cibo ({places.filter((p) => (travelSubTab === "da-visitare" ? !p.visited : p.visited) && p.category === "food").length})
                    </button>

                    <button
                      onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "sight" ? null : "sight")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 border cursor-pointer ${
                        selectedCategoryFilter === "sight"
                          ? "bg-sky-400 text-white border-sky-400 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-sky-50"
                      }`}
                    >
                      <span className="text-xs">📸</span> Attrazioni ({places.filter((p) => (travelSubTab === "da-visitare" ? !p.visited : p.visited) && p.category === "sight").length})
                    </button>

                    <button
                      onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "nature" ? null : "nature")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 border cursor-pointer ${
                        selectedCategoryFilter === "nature"
                          ? "bg-emerald-400 text-white border-emerald-400 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50"
                      }`}
                    >
                      <span className="text-xs">🌳</span> Natura ({places.filter((p) => (travelSubTab === "da-visitare" ? !p.visited : p.visited) && p.category === "nature").length})
                    </button>
                  </div>
                )}

                {/* Filtri categoria lingua per Books */}
                {activeTab === "books" && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Filtra:</span>
                    <button
                      onClick={() => setSelectedBookLanguageFilter(null)}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all shrink-0 border cursor-pointer ${
                        selectedBookLanguageFilter === null
                          ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Tutti ({books.filter((b) => (booksSubTab === "da-leggere" ? !b.read : b.read)).length})
                    </button>

                    <button
                      onClick={() => setSelectedBookLanguageFilter(selectedBookLanguageFilter === "italian" ? null : "italian")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all shrink-0 border cursor-pointer ${
                        selectedBookLanguageFilter === "italian"
                          ? "bg-[#78a964] text-white border-[#78a964] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50"
                      }`}
                    >
                      <ItalianFlagBadge className="w-3.5 h-3.5" />
                      In Italiano ({books.filter((b) => (booksSubTab === "da-leggere" ? !b.read : b.read) && b.language === "italian").length})
                    </button>

                    <button
                      onClick={() => setSelectedBookLanguageFilter(selectedBookLanguageFilter === "international" ? null : "international")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all shrink-0 border cursor-pointer ${
                        selectedBookLanguageFilter === "international"
                          ? "bg-[#4fa1e2] text-white border-[#4fa1e2] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-sky-50"
                      }`}
                    >
                      <WorldGlobeBadge className="w-3.5 h-3.5" />
                      Internazionali ({books.filter((b) => (booksSubTab === "da-leggere" ? !b.read : b.read) && b.language === "international").length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SEZIONE TRAVEL */}
            {activeTab === "travel" && (
              <div className="flex-1 relative overflow-hidden">
                {layoutMode === "map" ? (
                  <div className="w-full h-full">
                    <MapComponent
                      places={filteredPlaces}
                      onToggleVisited={handleToggleVisited}
                      onToggleFavorite={handleToggleFavorite}
                      onDeletePlace={handleDeletePlace}
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
                        const config = categoryConfig[place.category] || { borderColor: "border-l-slate-400", illustration: photoIllustration };
                        return (
                          <div
                            key={place.id}
                            onClick={() => {
                              setSelectedPlaceId(place.id);
                              setLayoutMode("map");
                            }}
                            className={`bg-white rounded-2xl border border-slate-100/80 border-l-[6px] ${config.borderColor} shadow-xs hover:shadow-md transition-all flex items-center justify-between p-4 gap-3 shrink-0 cursor-pointer group`}
                          >
                            <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center shrink-0 border border-slate-100 p-2">
                              <img src={config.illustration} alt="" className="w-full h-full object-contain" />
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                              <h3 className="font-bold text-slate-800 text-sm truncate">
                                {place.title}
                              </h3>
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {place.description || "Nessuna descrizione."}
                              </p>
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-[#F4ECE9] group-hover:bg-[#d64b38] group-hover:text-white text-[#d64b38] transition-all flex items-center justify-center shrink-0">
                              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Pulsante "+" per aggiungere un luogo */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="fixed bottom-24 right-5 sm:bottom-6 sm:right-6 z-40 bg-[#d64b38] hover:bg-[#c0402e] text-white p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center border border-white/20 cursor-pointer"
                  title="Aggiungi Luogo"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>
            )}

            {/* SEZIONE BOOKS (LIBRI) */}
            {activeTab === "books" && (
              <div className="flex-1 relative overflow-hidden">
                {booksLayoutMode === "pick" ? (
                  /* Pick/Shuffle Mode (matching Scegli libro.jpg) */
                  <BookPickSection
                    toReadBooks={books.filter((b) => !b.read)}
                    onPickBook={handlePickBook}
                    onAddNewBook={() => setIsAddBookModalOpen(true)}
                  />
                ) : (
                  /* List Mode (matching Libri.jpg & Libri letti.jpg) */
                  <div className="w-full h-full overflow-y-auto p-4 pb-28 flex flex-col gap-3.5 md:grid md:grid-cols-2 xl:grid-cols-3 md:items-start md:content-start">
                    {filteredBooks.length === 0 ? (
                      <div className="md:col-span-2 xl:col-span-3 text-center py-16 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                          <BookOpen className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col gap-1 px-8">
                          <span className="font-semibold text-slate-800 text-sm">
                            {booksSubTab === "da-leggere" ? "Nessun libro da leggere" : "Nessun libro letto ancora"}
                          </span>
                          <p className="text-xs text-slate-400">
                            {booksSubTab === "da-leggere"
                              ? "Aggiungi nuovi libri alla tua lista con il pulsante + !"
                              : "I libri che contrassegni come letti appariranno qui."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      filteredBooks.map((book) => {
                        const isItalian = book.language === "italian";
                        const borderAccentColor = isItalian ? "border-l-[#78a964]" : "border-l-[#4fa1e2]";

                        return (
                          <div
                            key={book.id}
                            onClick={() => setActiveDetailBook(book)}
                            className={`bg-white rounded-2xl border border-slate-100/80 border-l-[6px] ${borderAccentColor} shadow-xs hover:shadow-md transition-all flex items-center justify-between p-4 gap-3.5 shrink-0 cursor-pointer group`}
                          >
                            {/* Circular badge (matching Libri.jpg) */}
                            {isItalian ? (
                              <ItalianFlagBadge className="w-12 h-12" />
                            ) : (
                              <WorldGlobeBadge className="w-12 h-12" />
                            )}

                            {/* Details: Title, author, description */}
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                              <h3 className="font-bold text-slate-800 text-sm truncate">
                                {book.title}
                              </h3>
                              <p className="text-xs text-slate-600 font-medium truncate">
                                {book.author || "Autore non specificato"}
                              </p>
                              <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                                {book.description || "Nessuna descrizione breve."}
                              </p>
                            </div>

                            {/* Right Arrow area */}
                            <div className="w-10 h-10 rounded-xl bg-[#F4ECE9] group-hover:bg-[#d64b38] group-hover:text-white text-[#d64b38] transition-all flex items-center justify-center shrink-0">
                              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Pulsante "+" per aggiungere un libro */}
                <button
                  onClick={() => setIsAddBookModalOpen(true)}
                  className="fixed bottom-24 right-5 sm:bottom-6 sm:right-6 z-40 bg-[#d64b38] hover:bg-[#c0402e] text-white p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center border border-white/20 cursor-pointer"
                  title="Aggiungi Libro"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>
            )}

            {/* SEZIONE ALTRI LINK (IDEE, FILM, RICETTE) */}
            {activeTab !== "travel" && activeTab !== "books" && (
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
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3 relative hover:shadow-md transition-all shrink-0"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-col min-w-0">
                            <h3 className="font-bold text-slate-800 text-sm truncate">{item.title}</h3>
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#d64b38] hover:underline inline-flex items-center gap-1 mt-0.5"
                              >
                                Apri link <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteOtherLink(item.id)}
                            className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors shrink-0 cursor-pointer"
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
                  className="fixed bottom-24 right-5 sm:bottom-6 sm:right-6 z-40 bg-[#d64b38] hover:bg-[#c0402e] text-white p-4 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center border border-white/20 cursor-pointer"
                  title="Aggiungi Link"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALI TRAVEL */}
      {isAddModalOpen && (
        <AddPlaceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddPlace={handleAddPlace}
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

      {/* MODALI BOOKS (matching Dettaglio libro.jpg, Add & Edit) */}
      {activeDetailBook && (
        <BookDetailModal
          isOpen={!!activeDetailBook}
          book={activeDetailBook}
          onClose={() => setActiveDetailBook(null)}
          onShuffleNext={() => handlePickBook(shuffleCategoryContext)}
          onToggleRead={handleToggleBookRead}
          onToggleFavorite={handleToggleBookFavorite}
          onEditBook={(bookToEdit) => setEditingBook(bookToEdit)}
          onDeleteBook={handleDeleteBook}
          showShuffleButton={true}
        />
      )}

      {isAddBookModalOpen && (
        <AddBookModal
          isOpen={isAddBookModalOpen}
          onClose={() => setIsAddBookModalOpen(false)}
          onAddBook={handleAddBook}
        />
      )}

      {editingBook && (
        <EditBookModal
          isOpen={!!editingBook}
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onUpdateBook={handleUpdateBook}
          onDeleteBook={handleDeleteBook}
        />
      )}

      {/* MODALI ALTRI LINK */}
      {isOtherLinkModalOpen && (
        <AddOtherLinkModal
          isOpen={isOtherLinkModalOpen}
          onClose={() => setIsOtherLinkModalOpen(false)}
          onAddItem={handleAddOtherLink}
          defaultCategory={activeTab !== "travel" ? activeTab : "ideas"}
        />
      )}
    </div>
  );
}
