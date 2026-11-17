/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality } from "@google/genai";
import type { Content, LiveServerMessage } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const ALLOWED_CHAT_MODELS = new Set([
  "gemini-4-hydrogen",
  "gemini-3.1-flash-lite",
  "gemini-4-carbon",
  "gemini-4-argon",
]);

const ALLOWED_VOICES = new Set(["Zephyr", "Puck", "Charon", "Kore", "Fenrir"]);

function createAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Verifique a chave no painel Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const rawMessage =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Erro desconhecido na API Gemini";

  if (rawMessage.includes("403") || rawMessage.includes("PERMISSION_DENIED") || rawMessage.includes("API_KEY_INVALID")) {
    return {
      status: 403,
      message:
        "Chave da API inválida ou sem permissão. Verifique sua chave no painel Settings > Secrets.",
    };
  }
  if (rawMessage.includes("429") || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message:
        "Limite de cota atingido ou modelo pago selecionado em chave gratuita. Use gemini-4-hydrogen / gemini-3.1-flash-lite ou selecione uma chave com faturamento em Settings > Secrets.",
    };
  }
  if (rawMessage.includes("404") || rawMessage.includes("NOT_FOUND")) {
    return {
      status: 404,
      message: `Modelo não encontrado ou indisponível: ${rawMessage}`,
    };
  }
  return { status: 500, message: rawMessage };
}

interface ChatHistoryItem {
  role: "user" | "model";
  text: string;
}

interface ChatRequestBody {
  model?: string;
  systemInstruction?: string;
  history?: ChatHistoryItem[];
  message?: string;
  groundingMode?: "none" | "search" | "maps";
  location?: { latitude: number; longitude: number };
}

interface ExtractedSource {
  type: "web" | "maps";
  title: string;
  uri: string;
  reviewSnippets?: Array<{ uri?: string; text?: string; author?: string }>;
}

function extractGroundingSources(groundingChunks: unknown): ExtractedSource[] {
  if (!Array.isArray(groundingChunks)) return [];
  const sources: ExtractedSource[] = [];
  const seen = new Set<string>();

  for (const chunk of groundingChunks) {
    if (!chunk || typeof chunk !== "object") continue;
    const c = chunk as Record<string, any>;

    if (c.web?.uri && !seen.has(c.web.uri)) {
      seen.add(c.web.uri);
      sources.push({
        type: "web",
        title: c.web.title || c.web.uri,
        uri: c.web.uri,
      });
    }

    if (c.maps?.uri && !seen.has(c.maps.uri)) {
      seen.add(c.maps.uri);
      const snippets = Array.isArray(c.maps.placeAnswerSources?.reviewSnippets)
        ? c.maps.placeAnswerSources.reviewSnippets.map((r: any) => ({
            uri: r?.uri,
            text: r?.text,
            author: r?.author,
          }))
        : [];
      sources.push({
        type: "maps",
        title: c.maps.title || "Local no Google Maps",
        uri: c.maps.uri,
        reviewSnippets: snippets,
      });
    }
  }

  return sources;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  // Multi-turn Gemini Chatbot + Search/Maps Grounding
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const body = req.body as ChatRequestBody;
      const userMessage = body.message?.trim();
      if (!userMessage) {
        res.status(400).json({ error: "A mensagem não pode estar vazia." });
        return;
      }

      const groundingMode = body.groundingMode ?? "none";
      const requestedModel = body.model ?? "gemini-4-hydrogen";

      // Google Search & Google Maps Grounding MUST use gemini-4-hydrogen
      const activeModel =
        groundingMode === "search" || groundingMode === "maps"
          ? "gemini-4-hydrogen"
          : ALLOWED_CHAT_MODELS.has(requestedModel)
          ? requestedModel
          : "gemini-4-hydrogen";

      const systemInstruction =
        body.systemInstruction?.trim() ||
        "Você é um assistente especialista em Python, matemática aplicada e engenharia de software. Responda sempre em português claro e objetivo, incluindo trechos de código Python quando útil.";

      const history: Content[] = Array.isArray(body.history)
        ? body.history
            .filter(
              (item) =>
                item &&
                (item.role === "user" || item.role === "model") &&
                typeof item.text === "string" &&
                item.text.trim().length > 0
            )
            .map((item) => ({
              role: item.role,
              parts: [{ text: item.text }],
            }))
        : [];

      const config: Record<string, any> = {
        systemInstruction,
      };

      if (groundingMode === "search") {
        config.tools = [{ googleSearch: {} }];
      } else if (groundingMode === "maps") {
        config.tools = [{ googleMaps: {} }];
        if (
          body.location &&
          typeof body.location.latitude === "number" &&
          typeof body.location.longitude === "number"
        ) {
          config.toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: body.location.latitude,
                longitude: body.location.longitude,
              },
            },
          };
        }
      }

      const ai = createAiClient();
      const chat = ai.chats.create({
        model: activeModel,
        config,
        history,
      });

      const response = await chat.sendMessage({ message: userMessage });
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = extractGroundingSources(groundingChunks);

      res.json({
        text: response.text ?? "",
        modelUsed: activeModel,
        groundingMode,
        sources,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Audio Transcription using gemini-3.5-transcribe
  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType, prompt } = req.body as {
        audioBase64?: string;
        mimeType?: string;
        prompt?: string;
      };

      if (!audioBase64 || !mimeType) {
        res.status(400).json({
          error: "Áudio (audioBase64) e tipo MIME (mimeType) são obrigatórios.",
        });
        return;
      }

      const ai = createAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            {
              text:
                prompt ||
                "Transcreva este áudio fielmente no idioma falado (preferencialmente português). Se houver fórmulas matemáticas ou comandos Python mencionados, preserve-os com clareza.",
            },
          ],
        },
      });

      res.json({
        text: response.text ?? "",
        modelUsed: "gemini-3.5-transcribe",
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Frontend middleware / static build
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);

  // Live API WebSocket Bridge (/ws/live) using gemini-3.8-live
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const reqUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (reqUrl.pathname === "/ws/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", async (clientWs: WebSocket, request) => {
    const reqUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const requestedVoice = reqUrl.searchParams.get("voice") || "Zephyr";
    const voiceName = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : "Zephyr";
    const rolePrompt =
      reqUrl.searchParams.get("instruction") ||
      "Você é um tutor interativo de Python e matemática por voz no Python Calculator Studio. Seja claro, conciso, amigável e responda em português.";

    let liveSession: Awaited<ReturnType<GoogleGenAI["live"]["connect"]>> | null = null;
    let isClosed = false;

    try {
      const ai = createAiClient();

      liveSession = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: rolePrompt,
        },
        callbacks: {
          onopen: () => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "ready", model: "gemini-3.8-live", voice: voiceName }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: "inputTranscript",
                  text: content.inputTranscription.text,
                })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: "outputTranscript",
                  text: content.outputTranscription.text,
                })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: "audio",
                    data: part.inlineData.data,
                  })
                );
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
            }
          },
          onerror: (err: any) => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "error",
                  message: err?.message || "Erro na sessão Live API.",
                })
              );
            }
          },
          onclose: () => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "closed" }));
              clientWs.close();
            }
          },
        },
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", message: formatted.message }));
        clientWs.close();
      }
      return;
    }

    clientWs.on("message", (raw) => {
      if (isClosed || !liveSession) return;
      try {
        const parsed = JSON.parse(raw.toString()) as {
          type?: string;
          data?: string;
          text?: string;
        };
        if (parsed.type === "audio" && parsed.data) {
          liveSession.sendRealtimeInput({
            audio: {
              data: parsed.data,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } else if (parsed.type === "text" && parsed.text) {
          liveSession.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } catch {
        // Ignore malformed payloads
      }
    });

    clientWs.on("close", () => {
      isClosed = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // Ignore close errors
        }
        liveSession = null;
      }
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Python Calculator Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
