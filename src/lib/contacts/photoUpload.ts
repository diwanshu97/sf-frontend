import "server-only";

import { PHOTO_ACCEPTED_TYPES, PHOTO_MAX_BYTES } from "./schema";

/**
 * Resolve the photo at the trusted Server Action boundary. A real file wins
 * over the hidden preview value, which keeps uploads correct before hydration
 * and while the browser is still preparing its preview.
 */
export async function photoValueFromFormData(formData: FormData): Promise<{
  value: string;
  error?: string;
}> {
  const existingValue = String(formData.get("photo") ?? "");
  const upload = formData.get("photo_file");
  if (
    upload === null ||
    typeof upload === "string" ||
    typeof upload.arrayBuffer !== "function" ||
    upload.size === 0
  ) {
    return { value: existingValue };
  }

  if (!(PHOTO_ACCEPTED_TYPES as readonly string[]).includes(upload.type)) {
    return {
      value: existingValue,
      error: "Choose a JPEG, PNG, or WebP image.",
    };
  }
  if (upload.size > PHOTO_MAX_BYTES) {
    return {
      value: existingValue,
      error: "Choose an image no larger than 2 MiB.",
    };
  }

  const encoded = Buffer.from(await upload.arrayBuffer()).toString("base64");
  return { value: `data:${upload.type};base64,${encoded}` };
}
