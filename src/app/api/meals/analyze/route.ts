import { analyzeMealForm, mealErrorResponse } from "@/features/meals/analyze-meal";
import { getSession } from "@/lib/session";

// POST multipart/form-data { image: File, note?: string } → MealResult JSON (signed-in users only)
export async function POST(request: Request) {
  if (!(await getSession())) {
    return Response.json(
      { error: "Bạn cần đăng nhập để dùng tính năng này." },
      { status: 401 },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  try {
    return Response.json(await analyzeMealForm(form));
  } catch (error) {
    return mealErrorResponse(error);
  }
}
