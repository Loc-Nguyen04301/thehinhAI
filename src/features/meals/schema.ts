import { z } from "zod";

// This schema is sent to Claude as the structured output format, so the
// .describe() texts are instructions to the model. Adding a field here:
// also show it in meal-result.tsx.

const NutritionSchema = z.object({
  kcal: z.number().nonnegative().describe("Năng lượng, đơn vị kcal"),
  protein: z.number().nonnegative().describe("Chất đạm, đơn vị gam"),
  carbs: z.number().nonnegative().describe("Tinh bột/carb, đơn vị gam"),
  fat: z.number().nonnegative().describe("Chất béo, đơn vị gam"),
});

export const MealItemSchema = NutritionSchema.extend({
  name: z.string().describe("Tên món hoặc thành phần, tiếng Việt có dấu"),
  portion: z.string().describe("Khẩu phần ước tính, ví dụ: '1 tô lớn (~550 g)', '2 muỗng canh'"),
});

/** What Claude returns. */
export const MealAnalysisSchema = z.object({
  isFood: z.boolean().describe("false nếu ảnh không có đồ ăn hoặc đồ uống"),
  items: z.array(MealItemSchema).describe("Từng món/thành phần trong bữa ăn; rỗng nếu isFood = false"),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe("Mức tự tin của ước tính: low khi ảnh mờ, khẩu phần khó đoán hoặc món bị che"),
  notes: z
    .string()
    .describe("1–3 câu tiếng Việt: giả định chính về khẩu phần, cách nấu; không đưa lời khuyên y khoa"),
});

/** What POST /api/meals/analyze returns: Claude's analysis plus totals computed on the server. */
export const MealResultSchema = MealAnalysisSchema.extend({
  total: NutritionSchema,
});

export type Nutrition = z.infer<typeof NutritionSchema>;
export type MealAnalysis = z.infer<typeof MealAnalysisSchema>;
export type MealResult = z.infer<typeof MealResultSchema>;

export const MAX_NOTE_LENGTH = 500;
