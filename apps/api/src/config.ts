import "dotenv/config";

export const config = {
  // Cloudflare R2
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "tourandot-audio",
    publicUrl: process.env.R2_PUBLIC_URL || "", // e.g., https://audio.yourdomain.com
  },

  // ElevenLabs TTS
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || "",
    voiceId: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM", // Default: Rachel
    modelId: process.env.ELEVENLABS_MODEL_ID || "eleven_monolingual_v1",
  },

  // Server
  port: parseInt(process.env.PORT || "3000", 10),
};

// Validation
export function validateConfig() {
  const missing: string[] = [];

  if (!config.r2.accountId) missing.push("R2_ACCOUNT_ID");
  if (!config.r2.accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!config.r2.secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!config.elevenlabs.apiKey) missing.push("ELEVENLABS_API_KEY");

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
    console.warn("Audio generation will be disabled.");
    return false;
  }

  return true;
}
