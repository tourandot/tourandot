export type NarrationStyle = "quick" | "balanced" | "verbose";

export const NARRATION_STYLES: NarrationStyle[] = ["quick", "balanced", "verbose"];

export const NARRATION_LABELS: Record<NarrationStyle, string> = {
  quick: "Quick",
  balanced: "Balanced",
  verbose: "Verbose",
};
