"use client";

import Image from "next/image";
import { Camera, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent } from "react";
import Button, { buttonClasses } from "@/components/ui/Button";
import {
  PHOTO_ACCEPT,
  PHOTO_ACCEPTED_TYPES,
  PHOTO_MAX_BYTES,
} from "@/lib/contacts/schema";

const PHOTO_MAX_LABEL = "2 MiB";

export default function ContactPhotoField({
  initialPhoto,
  error,
}: {
  initialPhoto: string | null;
  error?: string;
}) {
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const fileInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState(initialPhoto);
  const [localError, setLocalError] = useState<string>();
  const message = localError ?? error;

  function resetFileInput() {
    if (fileInput.current) fileInput.current.value = "";
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(PHOTO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      setLocalError("Choose a JPEG, PNG, or WebP image.");
      resetFileInput();
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setLocalError(`Choose an image no larger than ${PHOTO_MAX_LABEL}.`);
      resetFileInput();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setLocalError("That image could not be read. Choose another file.");
        return;
      }
      setPhoto(reader.result);
      setLocalError(undefined);
      resetFileInput();
    };
    reader.onerror = () => {
      setLocalError("That image could not be read. Choose another file.");
      resetFileInput();
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhoto(null);
    setLocalError(undefined);
    resetFileInput();
  }

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Photo</legend>

      <div className="border-b border-hairline pb-2">
        <h2 className="font-display text-sm font-semibold text-foreground">Photo</h2>
        <p id={helpId} className="text-[13px] text-muted-foreground">
          Optional. JPEG, PNG, or WebP, up to {PHOTO_MAX_LABEL}.
        </p>
      </div>

      <input type="hidden" name="photo" value={photo ?? ""} />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-muted-foreground">
          {photo ? (
            <Image
              src={photo}
              alt="Contact photo preview"
              width={96}
              height={96}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={inputId}
              className={buttonClasses("secondary", "md", "cursor-pointer")}
            >
              <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {photo ? "Replace photo" : "Choose photo"}
            </label>
            <input
              ref={fileInput}
              id={inputId}
              type="file"
              accept={PHOTO_ACCEPT}
              onChange={choosePhoto}
              aria-describedby={`${helpId}${message ? ` ${errorId}` : ""}`}
              aria-invalid={message ? true : undefined}
              className="sr-only"
            />

            {photo ? (
              <Button type="button" variant="ghost" onClick={removePhoto}>
                <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>

          {message ? (
            <p id={errorId} role="alert" className="text-[13px] text-destructive">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
