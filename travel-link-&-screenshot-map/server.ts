import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body size limit to accept base64 screenshot uploads
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini API Client lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY environment variable is not defined or is placeholder. Using fallback extraction logic.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint to extract place details from a link or screenshot
app.post("/api/analyze-place", async (req, res) => {
  const { link, screenshot, category } = req.body;

  try {
    const ai = getAiClient();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        success: true,
        source: "mock",
        data: getMockPlace(link, category)
      });
    }

    let contents: any[] = [];
    let promptText = "Analizza il link o lo screenshot fornito per identificare il luogo, monumento o locale.";

    if (link) {
      promptText += `\nLink / Testo del post: ${link}`;
    }

    contents.push({ text: promptText });

    if (screenshot) {
      const matches = screenshot.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contents.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contents },
      config: {
        systemInstruction: `Sei una guida turistica ed esperto OCR. 
Analizza lo screenshot o il link dell'utente ed esegui l'OCR del testo visibile per identificare esattamente il luogo, monumento, ristorante o parco descritto.
NON inventare posti se non trovi riscontro visivo o testuale.

Rispondi in italiano in formato JSON:
1. title: Nome esatto del luogo.
2. description: Una breve sintesi di 1-2 righe in italiano.
3. category: Strictly uno tra: "food", "sight", "nature".
4. lat: Latitudine approssimativa del luogo.
5. lng: Longitudine approssimativa del luogo.
6. walkingDirections: Una breve indicazione in italiano su come arrivarci a piedi o con i mezzi.
7. mapUrl: Un link di ricerca su Google Maps (es. "https://www.google.com/maps/search/?api=1&query=Nome+Luogo").`,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            walkingDirections: { type: Type.STRING },
            mapUrl: { type: Type.STRING }
          },
          required: ["title", "description", "category", "lat", "lng", "walkingDirections", "mapUrl"]
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("No response text from Gemini API.");
    }

    const data = JSON.parse(textResult);
    return res.json({ success: true, source: "gemini", data });

  } catch (error: any) {
    console.error("Gemini place analysis error:", error);
    return res.json({
      success: true,
      source: "fallback",
      error: error.message,
      data: getMockPlace(link, category)
    });
  }
});

// Utility function for mock place data
function getMockPlace(link?: string, requestedCategory?: string) {
  const list = [
    {
      title: "Trastevere Vicolo Storico",
      description: "Caratteristico vicolo romano con edera arrampicata sulle pareti di mattone, vespette parcheggiate e sanpietrini umidi.",
      category: "sight",
      lat: 41.8893,
      lng: 12.4705,
      walkingDirections: "Prendi il Tram 8 da Piazza Venezia, scendi a Belli e cammina per 3 minuti nei vicoli interni.",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Trastevere+Roma"
    },
    {
      title: "Piazza Navona Pizza & Gelato",
      description: "Pizzeria all'aperto affacciata sulle spettacolari fontane barocche di Bernini. Ottima pizza romana sottile e croccante.",
      category: "food",
      lat: 41.8986,
      lng: 12.4731,
      walkingDirections: "Da Largo di Torre Argentina, cammina verso nord lungo Via dei Cestari per circa 7 minuti.",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Piazza+Navona+Roma"
    },
    {
      title: "Giardino degli Aranci",
      description: "Un'oasi di pace sull'Aventino che offre una delle viste panoramiche più belle e romantiche su tutta la città di Roma.",
      category: "nature",
      lat: 41.8848,
      lng: 12.4797,
      walkingDirections: "Prendi la Metro B fino a Circo Massimo, poi sali a piedi lungo Clivo dei Publicii per 10 minuti.",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Giardino+degli+Aranci+Roma"
    }
  ];

  if (link) {
    const l = link.toLowerCase();
    if (l.includes("pizza") || l.includes("food")) return list[1];
    if (l.includes("parco") || l.includes("giardino")) return list[2];
  }

  if (requestedCategory) {
    const matches = list.filter(item => item.category === requestedCategory);
    if (matches.length > 0) return matches[Math.floor(Math.random() * matches.length)];
  }

  return list[Math.floor(Math.random() * list.length)];
}

// REST API endpoint to extract book details from a link or screenshot
app.post("/api/analyze-book", async (req, res) => {
  const { link, screenshot, category } = req.body;

  try {
    const ai = getAiClient();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        success: true,
        source: "mock",
        data: getMockBook(link, category)
      });
    }

    let contents: any[] = [];
    let promptText = "Analizza l'immagine o il link fornito per estrarre le informazioni sul libro.";

    if (link) {
      promptText += `\nLink / Testo del post: ${link}`;
    }

    contents.push({ text: promptText });

    if (screenshot) {
      const matches = screenshot.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contents.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contents },
      config: {
        systemInstruction: `Sei un sistema OCR ed esperto bibliografico. 
Se è presente un'immagine, esegui la lettura visiva (OCR) del testo presente sia in sovrimpressione che sulla copertina del libro.
Trascrivi ESATTAMENTE il titolo e l'autore leggendoli direttamente dall'immagine. NON inventare titoli non presenti nella foto.

Rispondi in italiano in formato JSON:
1. title: Titolo esatto del libro letto nell'immagine.
2. author: Nome dell'autore (se visibile nell'immagine, altrimenti "Autore non specificato").
3. description: Una breve sintesi della trama o dei temi trattati in italiano (max 2 frasi).
4. language: Strictly "italian" (se l'autore o l'opera originale è italiana) o "international".`,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            description: { type: Type.STRING },
            language: { type: Type.STRING }
          },
          required: ["title", "author", "description", "language"]
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("No response text from Gemini API.");
    }

    const data = JSON.parse(textResult);
    return res.json({ success: true, source: "gemini", data });

  } catch (error: any) {
    console.error("Gemini book analysis error:", error);
    return res.json({
      success: true,
      source: "fallback",
      error: error.message,
      data: getMockBook(link, category)
    });
  }
});

// Utility function for mock book data
function getMockBook(link?: string, requestedCategory?: string) {
  const list = [
    {
      title: "Il nome della rosa",
      author: "Umberto Eco",
      description: "Un monaco francescano indaga su una serie di misteriosi omicidi in un'abbazia benedettina del XIV secolo, tra teologia e libri proibiti.",
      language: "italian"
    },
    {
      title: "Norwegian Wood",
      author: "Haruki Murakami",
      description: "Un giovane studente giapponese ripercorre i ricordi della sua giovinezza, sospesa tra amore e perdita.",
      language: "international"
    }
  ];

  if (link) {
    const l = link.toLowerCase();
    if (l.includes("murakami")) return list[1];
    if (l.includes("eco")) return list[0];
  }

  if (requestedCategory === "italian" || requestedCategory === "international") {
    const matches = list.filter(item => item.language === requestedCategory);
    if (matches.length > 0) return matches[Math.floor(Math.random() * matches.length)];
  }

  return list[Math.floor(Math.random() * list.length)];
}

// Serve Vite Dev Server in dev mode, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();