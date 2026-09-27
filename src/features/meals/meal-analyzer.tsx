"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { z } from "zod";
import { NavIconSvg } from "@/components/icons";
import { mayContainImage, readDropData, resolveDroppedImage } from "./drop-image";
import { MealResultCard } from "./meal-result";
import { resizeImage } from "./resize-image";
import { MAX_NOTE_LENGTH, MealResultSchema, type MealResult } from "./schema";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: MealResult };

/** The chosen photo: a local file (resized + uploaded) or a web image URL (downloaded by Claude). */
type Photo = { kind: "file"; file: File; previewUrl: string } | { kind: "url"; url: string };

const ErrorBodySchema = z.object({ error: z.string() });
const UNREADABLE_FILE = "Không đọc được ảnh này, bạn thử ảnh JPG hoặc PNG khác nhé.";
const UNREADABLE_URL = "Không tải được ảnh từ trang web này. Bạn lưu ảnh về máy rồi kéo vào nhé.";

async function requestAnalysis(photo: Photo, note: string): Promise<Status> {
  const body = new FormData();
  if (photo.kind === "file") {
    let image: Blob;
    try {
      image = await resizeImage(photo.file);
    } catch {
      return { kind: "error", message: UNREADABLE_FILE };
    }
    body.append("image", image, "meal.jpg");
  } else {
    body.append("imageUrl", photo.url);
  }
  body.append("note", note.trim());

  let response: Response;
  try {
    response = await fetch("/api/meals/analyze", { method: "POST", body });
  } catch {
    return { kind: "error", message: "Mất kết nối mạng, bạn kiểm tra và thử lại nhé." };
  }

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = ErrorBodySchema.safeParse(json);
    return {
      kind: "error",
      message: parsed.success ? parsed.data.error : "Chưa phân tích được ảnh, bạn thử lại nhé.",
    };
  }

  const parsed = MealResultSchema.safeParse(json);
  return parsed.success
    ? { kind: "done", result: parsed.data }
    : { kind: "error", message: "Kết quả từ AI không hợp lệ, bạn thử lại nhé." };
}

export function MealAnalyzer() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);

  // Free the previous preview's memory when the photo changes or on unmount
  useEffect(() => {
    return () => {
      if (photo?.kind === "file") URL.revokeObjectURL(photo.previewUrl);
    };
  }, [photo]);

  // Something dropped outside the drop zone (a file, or a link/image from another tab)
  // would make the browser open it and leave the page. Text fields keep normal behaviour.
  useEffect(() => {
    const blockStrayDrop = (event: DragEvent) => {
      const types = event.dataTransfer?.types ?? [];
      const target = event.target instanceof Element ? event.target : null;
      if ((types.includes("Files") || types.includes("text/uri-list")) && !target?.closest("input, textarea")) {
        event.preventDefault();
      }
    };
    window.addEventListener("dragover", blockStrayDrop);
    window.addEventListener("drop", blockStrayDrop);
    return () => {
      window.removeEventListener("dragover", blockStrayDrop);
      window.removeEventListener("drop", blockStrayDrop);
    };
  }, []);

  const loading = status.kind === "loading";

  function selectFile(file: File) {
    setPhoto({ kind: "file", file, previewUrl: URL.createObjectURL(file) });
    setStatus({ kind: "idle" });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) selectFile(file);
  }

  function handleDragOver(event: React.DragEvent<HTMLLabelElement>) {
    if (!mayContainImage(event.dataTransfer) || loading) return;
    event.preventDefault(); // allows dropping here
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLLabelElement>) {
    // Ignore leave events fired when moving over the zone's own children
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    if (!mayContainImage(event.dataTransfer)) return;
    event.preventDefault();
    setDragging(false);
    if (loading) return;
    const data = readDropData(event.dataTransfer); // must be read now, not after an await
    resolveDroppedImage(data)
      .then((dropped) => {
        if (!dropped) {
          setStatus({ kind: "error", message: "Bạn thả một ảnh (JPG, PNG…) nhé." });
        } else if (dropped.kind === "file") {
          selectFile(dropped.file);
        } else {
          setPhoto({ kind: "url", url: dropped.url });
          setStatus({ kind: "idle" });
        }
      })
      .catch(() => setStatus({ kind: "error", message: UNREADABLE_FILE }));
  }

  // The preview failed to load: the file isn't a displayable image, or the website blocks it.
  function handlePreviewError() {
    setStatus({ kind: "error", message: photo?.kind === "url" ? UNREADABLE_URL : UNREADABLE_FILE });
    setPhoto(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo) return;
    setStatus({ kind: "loading" });
    setStatus(await requestAnalysis(photo, note));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6">
        {/* Click to pick / take a photo, or drag and drop an image file onto it */}
        <label
          className="block cursor-pointer"
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="sr-only"
          />
          {photo ? (
            <div
              className={`relative aspect-4/3 overflow-hidden rounded-xl border-2 ${
                dragging ? "border-brand" : "border-border"
              }`}
            >
              <Image
                src={photo.kind === "file" ? photo.previewUrl : photo.url}
                alt="Ảnh bữa ăn đã chọn"
                fill
                unoptimized
                referrerPolicy="no-referrer" // some sites block images embedded on other domains
                onError={handlePreviewError}
                className="object-cover"
              />
              {photo.kind === "url" && !dragging && (
                <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-3 py-1 text-xs">
                  Ảnh từ trang web
                </span>
              )}
              {dragging ? (
                <span className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <span className="rounded-full bg-brand px-5 py-2.5 font-semibold text-background shadow-lg">
                    Thả để đổi ảnh
                  </span>
                </span>
              ) : (
                <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-3 py-1 text-xs">
                  Đổi ảnh
                </span>
              )}
            </div>
          ) : (
            <div
              className={`flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition-colors ${
                dragging
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-muted hover:border-brand hover:text-brand"
              }`}
            >
              <NavIconSvg name="camera" className="size-10" />
              {dragging ? (
                <span className="font-medium">Thả ảnh vào đây</span>
              ) : (
                <>
                  <span className="font-medium">
                    Chụp hoặc chọn ảnh bữa ăn
                    <span className="hidden md:inline">, hoặc kéo thả ảnh vào đây</span>
                  </span>
                  <span className="text-xs">Chụp từ trên xuống, đủ sáng sẽ cho kết quả tốt hơn</span>
                </>
              )}
            </div>
          )}
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-muted">Mô tả thêm (không bắt buộc)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={MAX_NOTE_LENGTH}
            rows={2}
            disabled={loading}
            placeholder="VD: tô phở bò size lớn, mình ăn hết nước; cơm 1 bát rưỡi"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-brand"
          />
        </label>

        <button
          type="submit"
          disabled={!photo || loading}
          className="w-full rounded-xl bg-brand py-3 font-semibold text-background transition-colors hover:bg-brand-hover active:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Đang phân tích… (khoảng 10–20 giây)" : "Phân tích bữa ăn"}
        </button>

        {status.kind === "error" && (
          <p role="alert" className="text-sm text-danger">
            {status.message}
          </p>
        )}
      </form>

      <div aria-live="polite">
        {status.kind === "done" && <MealResultCard result={status.result} />}
      </div>
    </div>
  );
}
