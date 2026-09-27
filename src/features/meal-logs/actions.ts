"use server";

import { refresh } from "next/cache";
import { getSession } from "@/lib/session";
import { deleteMealLog, insertMealLog, updateMealLog } from "./repository";
import { firstIssueMessage, MealLogInputSchema } from "./types";

// Server Actions are public POST endpoints: always re-check the session and validate input here.

export type ActionResult = { ok: true } | { ok: false; error: string };

const SIGNED_OUT: ActionResult = {
  ok: false,
  error: "Phiên đăng nhập đã hết hạn, bạn đăng nhập lại nhé.",
};

export async function addMealLogAction(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return SIGNED_OUT;

  const parsed = MealLogInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  try {
    await insertMealLog(session.user.id, parsed.data);
  } catch (error) {
    console.error("[meal-logs/add]", error);
    return { ok: false, error: "Chưa lưu được món ăn, bạn thử lại nhé." };
  }
  refresh(); // re-render the page with fresh data from the database
  return { ok: true };
}

export async function updateMealLogAction(id: string, input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return SIGNED_OUT;

  const parsed = MealLogInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  try {
    const updated = await updateMealLog(session.user.id, String(id), parsed.data);
    if (!updated) return { ok: false, error: "Không tìm thấy món ăn này." };
  } catch (error) {
    console.error("[meal-logs/update]", error);
    return { ok: false, error: "Chưa lưu được thay đổi, bạn thử lại nhé." };
  }
  refresh();
  return { ok: true };
}

export async function removeMealLogAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return SIGNED_OUT;

  try {
    const deleted = await deleteMealLog(session.user.id, String(id));
    if (!deleted) return { ok: false, error: "Không tìm thấy món ăn này." };
  } catch (error) {
    console.error("[meal-logs/remove]", error);
    return { ok: false, error: "Chưa xoá được món ăn, bạn thử lại nhé." };
  }
  refresh();
  return { ok: true };
}
