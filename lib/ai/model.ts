import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

/**
 * Swappable model layer.
 *
 * The provider/model is chosen from the `LUMI_MODEL` env var with the form
 * `provider:model` (e.g. `google:gemini-2.5-flash`). Default is Gemini's free
 * tier. To switch providers later:
 *   1. `npm i @ai-sdk/groq` (or @ai-sdk/anthropic, etc.)
 *   2. import it and add a `case` below
 *   3. set LUMI_MODEL + that provider's API key
 * The chat route, tools, and widgets never change.
 */
export function getModel(): LanguageModel {
  const raw = process.env.LUMI_MODEL?.trim() || "google:gemini-2.5-flash";
  const sep = raw.indexOf(":");
  const provider = sep === -1 ? "google" : raw.slice(0, sep);
  const model = sep === -1 ? raw : raw.slice(sep + 1);

  switch (provider) {
    case "google":
      return google(model);
    // case "groq":
    //   return groq(model);
    // case "anthropic":
    //   return anthropic(model);
    default:
      return google(model);
  }
}
