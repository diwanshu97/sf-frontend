import { File as NodeFile } from "node:buffer";
import { PHOTO_MAX_BYTES } from "@/lib/contacts/schema";
import { photoValueFromFormData } from "@/lib/contacts/photoUpload";

function photoForm(file?: unknown, existing = "") {
  const formData = new FormData();
  formData.set("photo", existing);
  if (file) formData.set("photo_file", file as Blob);
  return formData;
}

describe("photoValueFromFormData", () => {
  it("keeps the hidden value when no new file was submitted", async () => {
    await expect(photoValueFromFormData(photoForm(undefined, "existing"))).resolves.toEqual({
      value: "existing",
    });
  });

  it("converts a submitted file and prioritizes it over stale preview state", async () => {
    const file = new NodeFile(
      [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
      "avatar.png",
      { type: "image/png" },
    );

    const result = await photoValueFromFormData(photoForm(file, "old-photo"));

    expect(result.error).toBeUndefined();
    expect(result.value).toMatch(/^data:image\/png;base64,/);
    expect(result.value).not.toBe("old-photo");
  });

  it("rejects unsupported and oversized files at the server boundary", async () => {
    const unsupported = new NodeFile(["text"], "avatar.svg", {
      type: "image/svg+xml",
    });
    const oversized = new NodeFile(["x"], "avatar.png", { type: "image/png" });
    Object.defineProperty(oversized, "size", { value: PHOTO_MAX_BYTES + 1 });

    await expect(photoValueFromFormData(photoForm(unsupported))).resolves.toMatchObject({
      error: "Choose a JPEG, PNG, or WebP image.",
    });
    await expect(photoValueFromFormData(photoForm(oversized))).resolves.toMatchObject({
      error: "Choose an image no larger than 2 MiB.",
    });
  });
});
