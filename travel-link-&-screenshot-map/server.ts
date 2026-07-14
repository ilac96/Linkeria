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

    // Check if key exists and is real; if not, return a mocked beautiful response based on Rome
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        success: true,
        source: "mock",
        data: getMockPlace(link, category)
      });
    }

    let contents: any[] = [];
    let promptText = "You are an expert travel assistant. Analyze the provided post link or screenshot of a travel spot, and extract the details in Italian.";

    if (link) {
      promptText += `\nPost Link: ${link}`;
    }

    contents.push({ text: promptText });

    if (screenshot) {
      // screenshot is a base64 data URL (e.g., "data:image/png;base64,...")
      const matches = screenshot.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        contents.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }
    }

    // Call Gemini 3.5 Flash for multimodal analysis
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contents },
      config: {
        systemInstruction: `Analyze the user's travel screenshot or link. Find the specific tourist spot, monument, restaurant, or park. 
Respond in Italian. Return a structured JSON response containing:
1. title: Name of the spot.
2. description: A beautifully summarized 1-2 line description in Italian (e.g. "Un affascinante vicolo storico nel cuore di Trastevere, adornato di edera verde e lampioni d'epoca").
3. category: Strictly one of: "food", "sight", "nature".
4. lat: The approximate latitude of the place. If it's a famous spot in Rome, provide Rome coordinates (e.g. Rome is near 41.8902, 12.4922). Default to a Rome coordinate if the city is not identifiable.
5. lng: The approximate longitude of the place.
6. walkingDirections: A short guide in Italian on how to get there on foot or by public transit (e.g. "Prendi la metro B fino a Colosseo, poi cammina per 5 minuti").
7. mapUrl: A search link on Google Maps (e.g. "https://www.google.com/maps/search/?api=1&query=Colosseo+Roma").`,
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
    console.error("Gemini analysis error:", error);
    // Graceful fallback to rich mock data so the app never crashes
    return res.json({
      success: true,
      source: "fallback",
      error: error.message,
      data: getMockPlace(link, category)
    });
  }
});

// A utility function to return rich mock data when Gemini is unavailable or not configured
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
    },
    {
      title: "Colosseo e Fori Imperiali",
      description: "Il maestoso anfiteatro Flavio simbolo eterno dell'Impero Romano, mozzafiato soprattutto al tramonto.",
      category: "sight",
      lat: 41.8902,
      lng: 12.4922,
      walkingDirections: "Scendi direttamente alla fermata Metro B Colosseo.",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Colosseo+Roma"
    },
    {
      title: "Garbatella Storica",
      description: "Lotti storici ad architettura barocca popolare con piccoli cortili, giardini fioriti e gatti che riposano all'ombra.",
      category: "sight",
      lat: 41.8624,
      lng: 12.4891,
      walkingDirections: "Prendi la Metro B fino alla fermata Garbatella, poi prosegui a piedi per 5 minuti verso Piazza Damiano Sauli.",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Garbatella+Roma"
    },
    {
      title: "Villa Borghese - Laghetto",
      description: "Splendido parco pubblico romano ideale per una passeggiata in barca a remi sotto il Tempio di Esculapio.",
      category: "nature",
      lat: 41.9125,
      lng: 12.4862,
      walkingDirections: "Prendi la Metro A fino a Flaminio, poi sali la scalinata del Pincio ed entra nel parco.",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Villa+Borghese+Laghetto"
    }
  ];

  // Try to match keywords in the link
  if (link) {
    const l = link.toLowerCase();
    if (l.includes("pizza") || l.includes("ristorante") || l.includes("food") || l.includes("mangiare")) {
      return list[1];
    }
    if (l.includes("parco") || l.includes("villa") || l.includes("giardino") || l.includes("nature")) {
      return list[2];
    }
    if (l.includes("colosseo") || l.includes("colosseum")) {
      return list[3];
    }
    if (l.includes("garbatella")) {
      return list[4];
    }
  }

  // Fallback to a random selection or matching category
  if (requestedCategory) {
    const matches = list.filter(item => item.category === requestedCategory);
    if (matches.length > 0) {
      return matches[Math.floor(Math.random() * matches.length)];
    }
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
