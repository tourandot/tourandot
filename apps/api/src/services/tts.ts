import { ElevenLabsClient } from "elevenlabs";
import { config } from "../config.js";
import { uploadAudio, getAudioKey, audioExists, getAudioUrl } from "./storage.js";

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: config.elevenlabs.apiKey,
});

export interface TTSResult {
  success: boolean;
  audioUrl?: string;
  error?: string;
  cached?: boolean;
}

/**
 * Convert text to speech using ElevenLabs
 * Returns the audio as a Buffer
 */
async function textToSpeech(text: string): Promise<Buffer> {
  const audioStream = await elevenlabs.textToSpeech.convert(
    config.elevenlabs.voiceId,
    {
      text,
      model_id: config.elevenlabs.modelId,
      output_format: "mp3_44100_128", // High quality MP3
    }
  );

  // Convert stream to buffer
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

/**
 * Generate audio for a narration (checks cache first)
 */
export async function generateNarrationAudio(
  stopId: string,
  style: string,
  text: string
): Promise<TTSResult> {
  const key = getAudioKey(stopId, "narration", style);

  try {
    // Check if already exists
    if (await audioExists(key)) {
      return {
        success: true,
        audioUrl: getAudioUrl(key),
        cached: true,
      };
    }

    // Generate audio
    const audioBuffer = await textToSpeech(text);

    // Upload to R2
    const audioUrl = await uploadAudio(key, audioBuffer);

    return {
      success: true,
      audioUrl,
      cached: false,
    };
  } catch (error: any) {
    console.error(`Failed to generate narration audio for ${stopId}/${style}:`, error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Generate audio for a fact (checks cache first)
 */
export async function generateFactAudio(
  stopId: string,
  factId: string,
  text: string
): Promise<TTSResult> {
  const key = getAudioKey(stopId, "fact", factId);

  try {
    // Check if already exists
    if (await audioExists(key)) {
      return {
        success: true,
        audioUrl: getAudioUrl(key),
        cached: true,
      };
    }

    // Generate audio
    const audioBuffer = await textToSpeech(text);

    // Upload to R2
    const audioUrl = await uploadAudio(key, audioBuffer);

    return {
      success: true,
      audioUrl,
      cached: false,
    };
  } catch (error: any) {
    console.error(`Failed to generate fact audio for ${stopId}/${factId}:`, error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Batch generate audio for multiple items
 * Returns a map of key -> audioUrl
 */
export async function batchGenerateAudio(
  items: Array<{
    stopId: string;
    type: "narration" | "fact";
    identifier: string;
    text: string;
  }>
): Promise<Map<string, TTSResult>> {
  const results = new Map<string, TTSResult>();

  // Process in parallel with concurrency limit
  const CONCURRENCY = 3;
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const key = getAudioKey(item.stopId, item.type, item.identifier);
        const result =
          item.type === "narration"
            ? await generateNarrationAudio(item.stopId, item.identifier, item.text)
            : await generateFactAudio(item.stopId, item.identifier, item.text);
        return { key, result };
      })
    );

    for (const { key, result } of batchResults) {
      results.set(key, result);
    }
  }

  return results;
}
