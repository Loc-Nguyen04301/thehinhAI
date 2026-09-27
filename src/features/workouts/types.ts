import { z } from "zod";

export const MUSCLE_GROUPS = [
  "Ngực",
  "Lưng",
  "Vai",
  "Tay trước",
  "Tay sau",
  "Chân",
  "Mông",
  "Bụng",
  "Toàn thân",
  "Cardio",
] as const;

export const COMMON_EXERCISES = [
  "Squat",
  "Deadlift",
  "Đẩy ngực nằm (Bench press)",
  "Đẩy vai (Overhead press)",
  "Kéo xà (Pull-up)",
  "Kéo cáp xô (Lat pulldown)",
  "Chèo tạ đòn (Barbell row)",
  "Hip thrust",
  "Đạp đùi (Leg press)",
  "Cuốn tạ tay trước (Bicep curl)",
  "Đẩy cáp tay sau (Tricep pushdown)",
  "Plank",
] as const;

/** What the user types in the form (validated before saving). */
export const WorkoutInputSchema = z.object({
  date: z.iso.date("Ngày tập chưa hợp lệ"),
  exercise: z.string().trim().min(1, "Bạn nhập tên bài tập nhé").max(80, "Tên bài tập tối đa 80 ký tự"),
  muscleGroup: z.enum(MUSCLE_GROUPS, "Bạn chọn nhóm cơ nhé"),
  sets: z.coerce.number("Số hiệp phải là số").int("Số hiệp phải là số nguyên").min(1, "Số hiệp tối thiểu là 1").max(50, "Số hiệp tối đa là 50"),
  reps: z.coerce.number("Số lần phải là số").int("Số lần phải là số nguyên").min(1, "Số lần tối thiểu là 1").max(500, "Số lần tối đa là 500"),
  weightKg: z.coerce.number("Mức tạ phải là số").min(0, "Mức tạ không được âm").max(1000, "Mức tạ tối đa là 1000 kg"),
  note: z.string().trim().max(200, "Ghi chú tối đa 200 ký tự").optional(),
});

export type WorkoutInput = z.infer<typeof WorkoutInputSchema>;

/** A saved entry as sent to the client (id = MongoDB _id as hex, createdAt in ms). */
export type WorkoutEntry = WorkoutInput & { id: string; createdAt: number };

/** Volume = sets × reps × kg */
export function volumeOf(entry: Pick<WorkoutEntry, "sets" | "reps" | "weightKg">): number {
  return entry.sets * entry.reps * entry.weightKg;
}
