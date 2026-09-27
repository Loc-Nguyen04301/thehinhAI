"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { z } from "zod";
import { NavIconSvg } from "@/components/icons";
import { MealResultCard } from "./meal-result";
import { resizeImage } from "./resize-image";
import { MAX_NOTE_LENGTH, MealResultSchema, type MealResult } from "./schema";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: MealResult };

const ErrorBodySchema = z.object({ error: z.string() });

async function requestAnalysis(file: File, note: string): Promise<Status> {
  let image: Blob;
  try {
    image = await resizeImage(file);
  } catch {
    return { kind: "error", message: "Không đọc được ảnh này, bạn thử ảnh JPG hoặc PNG khác nhé." };
  }

  const body = new FormData();
  body.append("image", image, "meal.jpg");
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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Free the previous preview's memory when it changes or on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    setFile(picked);
    setPreviewUrl(picked ? URL.createObjectURL(picked) : null);
    setStatus({ kind: "idle" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setStatus({ kind: "loading" });
    setStatus(await requestAnalysis(file, note));
  }

  const loading = status.kind === "loading";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6">
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="sr-only"
          />
          {previewUrl ? (
            <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-border">
              <Image src={previewUrl} alt="Ảnh bữa ăn đã chọn" fill unoptimized className="object-cover" />
              <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-3 py-1 text-xs">
                Đổi ảnh
              </span>
            </div>
          ) : (
            <div className="flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted transition-colors hover:border-brand hover:text-brand">
              <NavIconSvg name="camera" className="size-10" />
              <span className="font-medium">Chụp hoặc chọn ảnh bữa ăn</span>
              <span className="text-xs">Chụp từ trên xuống, đủ sáng sẽ cho kết quả tốt hơn</span>
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
          disabled={!file || loading}
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
