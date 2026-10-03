"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api/apiError";
import { uploadWithProgress } from "@/lib/api/upload";
import type { ApiSuccess } from "@/types/api";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];

interface PickedFile {
  id: string;
  file: File;
  /** Object URL for image previews; null for PDFs. */
  previewUrl: string | null;
}

interface FileUploaderProps<T> {
  /** `image` accepts jpeg, png, webp and gif. `document` also accepts PDF. */
  kind: "image" | "document";
  /** Exact backend field name: profileImage, document, documents, images or image. */
  fieldName: string;
  /** Path relative to /api/v1, e.g. "/users/me". */
  url: string;
  method?: "POST" | "PATCH" | "PUT";
  maxFiles?: number;
  label: string;
  disabled?: boolean;
  onUploaded?: (response: ApiSuccess<T>) => void;
  onError?: (error: ApiError) => void;
  className?: string;
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function FileUploader<T = unknown>({
  kind,
  fieldName,
  url,
  method = "POST",
  maxFiles = 1,
  label,
  disabled = false,
  onUploaded,
  onError,
  className,
}: FileUploaderProps<T>) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const allowedTypes = kind === "image" ? IMAGE_TYPES : DOCUMENT_TYPES;
  const typeHint = kind === "image" ? "JPG, PNG, WebP or GIF" : "JPG, PNG, WebP, GIF or PDF";
  const uploading = progress !== null;
  const multiple = maxFiles > 1;

  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  });
  useEffect(
    () => () => {
      pickedRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    },
    [],
  );

  const releaseAll = (items: PickedFile[]) => {
    items.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  };

  const addFiles = (incoming: File[]) => {
    const problems: string[] = [];
    const accepted: PickedFile[] = [];

    for (const file of incoming) {
      if (!allowedTypes.includes(file.type)) {
        problems.push(`${file.name} is not allowed. Use ${typeHint}.`);
      } else if (file.size > MAX_SIZE_BYTES) {
        problems.push(`${file.name} is too large. Maximum 8 MB per file.`);
      } else {
        accepted.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        });
      }
    }

    // A single-file uploader replaces the previous pick, but only when something valid was chosen.
    const replace = !multiple && accepted.length > 0;
    if (replace) releaseAll(picked);
    let next = replace ? [] : [...picked];

    for (const item of accepted) {
      if (next.some((existing) => existing.id === item.id)) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      } else if (next.length >= maxFiles) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        problems.push(`You can add up to ${maxFiles} files. ${item.file.name} was skipped.`);
      } else {
        next = [...next, item];
      }
    }

    setPicked(next);
    setMessages(problems);
  };

  const removeFile = (id: string) => {
    const target = picked.find((item) => item.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    setPicked(picked.filter((item) => item.id !== id));
    setMessages([]);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    addFiles(Array.from(event.dataTransfer.files));
  };

  const upload = async () => {
    if (picked.length === 0) return;
    const formData = new FormData();
    picked.forEach((item) => formData.append(fieldName, item.file));

    setMessages([]);
    setProgress(0);
    try {
      const response = await uploadWithProgress<T>(url, formData, {
        method,
        onProgress: setProgress,
      });
      releaseAll(picked);
      setPicked([]);
      onUploaded?.(response);
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError(0, "Upload failed. Please try again");
      setMessages([apiError.errors[0]?.message || apiError.message]);
      onError?.(apiError);
    } finally {
      setProgress(null);
    }
  };

  const busy = disabled || uploading;

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept={allowedTypes.join(",")}
        multiple={multiple}
        disabled={busy}
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-8 text-center transition-colors duration-150 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          dragging && "border-primary bg-accent",
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {typeHint}, up to 8 MB each
          {multiple ? `, up to ${maxFiles} files` : ""}. Drag files here or click to browse.
        </span>
      </button>

      {messages.length > 0 ? (
        <ul role="alert" className="space-y-1 text-sm text-error-text">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}

      {picked.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {picked.map((item) => (
            <li
              key={item.id}
              className="relative overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              {item.previewUrl ? (
                // Blob URLs cannot go through next/image, so a plain img is used for local previews.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt={`Preview of ${item.file.name}`}
                  className="aspect-4/3 w-full object-cover"
                />
              ) : (
                <div className="flex aspect-4/3 w-full items-center justify-center bg-muted">
                  <FileText className="size-8 text-muted-foreground" aria-hidden="true" />
                </div>
              )}
              <div className="p-2">
                <p className="truncate text-xs font-medium text-foreground">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(item.file.size)}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={uploading}
                onClick={() => removeFile(item.id)}
                aria-label={`Remove ${item.file.name}`}
                className="absolute top-1 right-1 size-10 rounded-full shadow-sm"
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {uploading ? (
        <div className="space-y-1">
          <Progress value={progress} aria-label="Upload progress" />
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Uploading {progress}%
          </p>
        </div>
      ) : null}

      {picked.length > 0 ? (
        <div className="flex justify-end">
          <Button type="button" onClick={upload} disabled={busy}>
            {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {uploading ? "Uploading" : picked.length > 1 ? "Upload files" : "Upload file"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
