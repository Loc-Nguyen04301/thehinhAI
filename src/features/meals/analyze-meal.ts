import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CLAUDE_MODEL, getAnthropic } from "@/lib/anthropic";
import { siteConfig } from "@/lib/site";
import {
  MAX_NOTE_LENGTH,
  MealAnalysisSchema,
  type MealAnalysis,
  type MealResult,
  type Nutrition,
} from "./schema";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const SYSTEM_PROMPT = `Bạn là chuyên gia dinh dưỡng của ứng dụng thể hình "${siteConfig.name}", chuyên ước tính năng lượng và chất dinh dưỡng của bữa ăn từ ảnh chụp, đặc biệt là món ăn Việt Nam.

Cách làm:
- Nhận diện từng món hoặc thành phần chính trong ảnh, ước lượng khẩu phần, rồi ước tính kcal, protein, carb và chất béo cho từng món.
- Người dùng có thể gửi kèm mô tả (khẩu phần, cách nấu, món bị che khuất, đã ăn bao nhiêu). Mô tả này đáng tin hơn những gì nhìn thấy trong ảnh; khi mâu thuẫn, hãy theo mô tả.
- Khi không rõ cách chế biến, giả định cách nấu phổ biến ở Việt Nam. Nhớ tính cả nước dùng, nước chấm, dầu mỡ, đồ uống có đường nếu có trong ảnh.
- Dùng vật quen thuộc trong ảnh (bát, đũa, thìa, bàn tay) để ước lượng kích thước khẩu phần.
- Nếu ảnh không có đồ ăn hoặc đồ uống, đặt isFood = false và để danh sách món trống.
- Viết mọi nội dung bằng tiếng Việt có dấu, ngắn gọn, thân thiện.
- Đây là ước tính để tham khảo: không đưa lời khuyên y khoa, không khuyến khích nhịn ăn hay ăn kiêng cực đoan.`;

/** An error whose message is safe to show to the user. */
export class MealAnalysisError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "MealAnalysisError";
  }
}

function isImageType(type: string): type is ImageType {
  return (IMAGE_TYPES as readonly string[]).includes(type);
}

/** Validates the multipart form sent by the client (`image`, `note`) and analyzes it. */
export async function analyzeMealForm(form: FormData): Promise<MealResult> {
  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) {
    throw new MealAnalysisError("Bạn chưa chọn ảnh bữa ăn.", 400);
  }
  if (!isImageType(image.type)) {
    throw new MealAnalysisError("Ảnh cần ở định dạng JPG, PNG, WEBP hoặc GIF.", 415);
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new MealAnalysisError("Ảnh quá lớn (tối đa 4 MB), bạn chọn ảnh khác nhé.", 413);
  }

  const rawNote = form.get("note");
  const note = typeof rawNote === "string" ? rawNote.trim().slice(0, MAX_NOTE_LENGTH) : "";
  const data = Buffer.from(await image.arrayBuffer()).toString("base64");

  return analyzeMeal({ data, mediaType: image.type, note });
}

async function analyzeMeal(input: {
  data: string;
  mediaType: ImageType;
  note: string;
}): Promise<MealResult> {
  const response = await getAnthropic().messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    // Structured output: the response is validated against the zod schema by the SDK.
    output_config: { format: zodOutputFormat(MealAnalysisSchema) },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: input.mediaType, data: input.data },
          },
          {
            type: "text",
            text: input.note
              ? `Mô tả thêm của người dùng:\n${input.note}`
              : "Người dùng không mô tả thêm.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new MealAnalysisError("AI không thể phân tích ảnh này, bạn thử ảnh khác nhé.", 422);
  }
  const analysis = response.parsed_output;
  if (!analysis) {
    throw new Error(`Claude returned no parsed output (stop_reason: ${response.stop_reason})`);
  }
  if (!analysis.isFood) {
    throw new MealAnalysisError(
      "Mình không thấy đồ ăn trong ảnh. Bạn chụp lại bữa ăn rõ hơn nhé.",
      422,
    );
  }

  return { ...analysis, total: sumNutrition(analysis.items) };
}

function sumNutrition(items: MealAnalysis["items"]): Nutrition {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const total = items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + item.kcal,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return {
    kcal: Math.round(total.kcal),
    protein: round1(total.protein),
    carbs: round1(total.carbs),
    fat: round1(total.fat),
  };
}

/** Maps any error from analyzeMealForm to a JSON response with a Vietnamese message. */
export function mealErrorResponse(error: unknown): Response {
  if (error instanceof MealAnalysisError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[meals/analyze]", error);
  if (error instanceof Anthropic.RateLimitError) {
    return Response.json(
      { error: "Hệ thống AI đang quá tải, bạn thử lại sau ít phút nhé." },
      { status: 429 },
    );
  }
  if (error instanceof Anthropic.APIError && (error.status ?? 0) >= 500) {
    return Response.json(
      { error: "Dịch vụ AI đang gặp sự cố tạm thời, bạn thử lại sau nhé." },
      { status: 503 },
    );
  }
  return Response.json(
    { error: "Chưa phân tích được ảnh lúc này, bạn thử lại nhé." },
    { status: 500 },
  );
}
