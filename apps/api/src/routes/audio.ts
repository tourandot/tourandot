import { FastifyInstance } from "fastify";
import { validateConfig } from "../config.js";
import {
  generateNarrationAudio,
  generateFactAudio,
  batchGenerateAudio,
} from "../services/tts.js";
import { getAudioKey, getAudioUrl, audioExists } from "../services/storage.js";

// In-memory store for generation status (replace with Redis in production)
const generationStatus = new Map<
  string,
  {
    status: "pending" | "generating" | "complete" | "failed";
    progress: number;
    total: number;
    errors: string[];
  }
>();

export async function audioRoutes(app: FastifyInstance) {
  // Check if audio services are configured
  const audioEnabled = validateConfig();

  // GET /audio/status - Check if audio generation is available
  app.get("/status", async () => {
    return {
      enabled: audioEnabled,
      message: audioEnabled
        ? "Audio generation is available"
        : "Audio generation is disabled (missing configuration)",
    };
  });

  // POST /audio/generate/tour/:tourId - Generate all audio for a tour
  app.post<{
    Params: { tourId: string };
    Body: {
      narrations: Array<{
        stopId: string;
        style: string;
        text: string;
      }>;
      facts: Array<{
        stopId: string;
        factId: string;
        text: string;
      }>;
    };
  }>("/generate/tour/:tourId", async (request, reply) => {
    if (!audioEnabled) {
      return reply.status(503).send({
        error: "Audio generation is not configured",
      });
    }

    const { tourId } = request.params;
    const { narrations, facts } = request.body;

    // Check if already generating
    const existing = generationStatus.get(tourId);
    if (existing && existing.status === "generating") {
      return {
        status: "already_generating",
        progress: existing.progress,
        total: existing.total,
      };
    }

    const total = narrations.length + facts.length;

    // Initialize status
    generationStatus.set(tourId, {
      status: "generating",
      progress: 0,
      total,
      errors: [],
    });

    // Generate in background
    (async () => {
      const status = generationStatus.get(tourId)!;
      const errors: string[] = [];

      // Generate narration audio
      for (const narration of narrations) {
        const result = await generateNarrationAudio(
          narration.stopId,
          narration.style,
          narration.text
        );
        if (!result.success) {
          errors.push(`Narration ${narration.stopId}/${narration.style}: ${result.error}`);
        }
        status.progress++;
      }

      // Generate fact audio
      for (const fact of facts) {
        const result = await generateFactAudio(
          fact.stopId,
          fact.factId,
          fact.text
        );
        if (!result.success) {
          errors.push(`Fact ${fact.stopId}/${fact.factId}: ${result.error}`);
        }
        status.progress++;
      }

      status.status = errors.length > 0 ? "failed" : "complete";
      status.errors = errors;
    })();

    return {
      status: "started",
      tourId,
      total,
      message: "Audio generation started in background",
    };
  });

  // GET /audio/generate/status/:tourId - Check generation progress
  app.get<{ Params: { tourId: string } }>(
    "/generate/status/:tourId",
    async (request, reply) => {
      const { tourId } = request.params;
      const status = generationStatus.get(tourId);

      if (!status) {
        return reply.status(404).send({ error: "No generation found for this tour" });
      }

      return status;
    }
  );

  // POST /audio/generate/single - Generate audio for a single item
  app.post<{
    Body: {
      stopId: string;
      type: "narration" | "fact";
      identifier: string; // style or factId
      text: string;
    };
  }>("/generate/single", async (request, reply) => {
    if (!audioEnabled) {
      return reply.status(503).send({
        error: "Audio generation is not configured",
      });
    }

    const { stopId, type, identifier, text } = request.body;

    const result =
      type === "narration"
        ? await generateNarrationAudio(stopId, identifier, text)
        : await generateFactAudio(stopId, identifier, text);

    if (!result.success) {
      return reply.status(500).send({
        error: result.error,
      });
    }

    return {
      audioUrl: result.audioUrl,
      cached: result.cached,
    };
  });

  // GET /audio/check/:stopId/:type/:identifier - Check if audio exists
  app.get<{
    Params: {
      stopId: string;
      type: "narration" | "fact";
      identifier: string;
    };
  }>("/check/:stopId/:type/:identifier", async (request) => {
    const { stopId, type, identifier } = request.params;
    const key = getAudioKey(stopId, type as "narration" | "fact", identifier);
    const exists = await audioExists(key);

    return {
      exists,
      audioUrl: exists ? getAudioUrl(key) : null,
    };
  });
}
