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
  note: z.string().trim().max(200, "Ghi chú tối đa 200 ký tự").optional(),
});

export type MealLogInput = z.infer<typeof MealLogInputSchema>;

/** A saved entry as sent to the client (id = MongoDB _id as hex, createdAt in ms). */
export type MealLogEntry = MealLogInput & { id: string; createdAt: number };

/** Daily total = Σ kcal of that day's entries. */
export function totalKcal(entries: { kcal: number }[]): number {
  return entries.reduce((sum, entry) => sum + entry.kcal, 0);
}

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ, bạn kiểm tra lại nhé.";
}
