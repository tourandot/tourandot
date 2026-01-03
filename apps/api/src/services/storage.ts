import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "../config.js";

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export interface AudioFile {
  key: string; // e.g., "stop-1/balanced.mp3"
  url: string; // Public URL to access the file
  exists: boolean;
}

/**
 * Generate the storage key for an audio file
 */
export function getAudioKey(
  stopId: string,
  type: "narration" | "fact",
  identifier: string // style for narration, factId for fact
): string {
  if (type === "narration") {
    return `narrations/${stopId}/${identifier}.mp3`;
  }
  return `facts/${stopId}/${identifier}.mp3`;
}

/**
 * Get the public URL for an audio file
 */
export function getAudioUrl(key: string): string {
  if (config.r2.publicUrl) {
    return `${config.r2.publicUrl}/${key}`;
  }
  // Fallback to R2.dev URL if public URL not configured
  return `https://${config.r2.bucketName}.${config.r2.accountId}.r2.dev/${key}`;
}

/**
 * Check if an audio file exists in R2
 */
export async function audioExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
      })
    );
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Upload audio buffer to R2
 */
export async function uploadAudio(
  key: string,
  audioBuffer: Buffer,
  contentType: string = "audio/mpeg"
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
      Body: audioBuffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // Cache for 1 year
    })
  );

  return getAudioUrl(key);
}

/**
 * Get audio file metadata and URL if it exists
 */
export async function getAudioFile(key: string): Promise<AudioFile> {
  const exists = await audioExists(key);
  return {
    key,
    url: exists ? getAudioUrl(key) : "",
    exists,
  };
}

/**
 * Batch check which audio files exist
 */
export async function checkAudioFiles(
  keys: string[]
): Promise<Map<string, AudioFile>> {
  const results = new Map<string, AudioFile>();

  await Promise.all(
    keys.map(async (key) => {
      const file = await getAudioFile(key);
      results.set(key, file);
    })
  );

  return results;
}
