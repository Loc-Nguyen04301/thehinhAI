import { z } from "zod";

/** What the user types in the form (validated before saving). Entered by hand — no AI. */
export const MealLogInputSchema = z.object({
  date: z.iso.date("Ngày ăn chưa hợp lệ"),
  name: z.string().trim().min(1, "Bạn nhập tên món ăn nhé").max(80, "Tên món ăn tối đa 80 ký tự"),
  grams: z.coerce
    .number("Khối lượng phải là số")
    .int("Khối lượng phải là số nguyên")
    .min(1, "Khối lượng tối thiểu là 1 g")
    .max(5000, "Khối lượng tối đa 5000 g"),
  kcal: z.coerce
    .number("Kcal phải là số")
    .int("Kcal phải là số nguyên")
    .min(0, "Kcal không được âm")
    .max(5000, "Kcal tối đa 5000"),
});

export type MealLogInput = z.infer<typeof MealLogInputSchema>;

/** A saved entry as sent to the client (id = MongoDB _id as hex, createdAt in ms). */
export type MealLogEntry = MealLogInput & { id: string; createdAt: number };

/** Longest history range the user can pick (inclusive days). */
export const MAX_RANGE_DAYS = 366;

/** Days since the epoch in UTC, so DST can't shift the count. */
function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** History filter `?from=YYYY-MM-DD&to=YYYY-MM-DD`, both days included. */
export const DateRangeSchema = z
  .object({
    from: z.iso.date("Bạn chọn ngày bắt đầu nhé"),
    to: z.iso.date("Bạn chọn ngày kết thúc nhé"),
  })
  .refine((range) => range.from <= range.to, "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc")
  .refine(
    (range) => dayNumber(range.to) - dayNumber(range.from) + 1 <= MAX_RANGE_DAYS,
    `Bạn chọn khoảng tối đa ${MAX_RANGE_DAYS} ngày nhé`,
  );

export type DateRange = z.infer<typeof DateRangeSchema>;

/** Daily total = Σ kcal of that day's entries. */
export function totalKcal(entries: { kcal: number }[]): number {
  return entries.reduce((sum, entry) => sum + entry.kcal, 0);
}

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ, bạn kiểm tra lại nhé.";
}
