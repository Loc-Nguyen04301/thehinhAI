"use server";

import { refresh } from "next/cache";
import { getSession } from "@/lib/session";
import { deleteWorkout, insertWorkout, updateWorkout } from "./repository";
import { firstIssueMessage, WorkoutInputSchema } from "./types";

// Server Actions are public POST endpoints: always re-check the session and validate input here.

export type ActionResult = { ok: true } | { ok: false; error: string };

const SIGNED_OUT: ActionResult = {
  ok: false,
  error: "Phiên đăng nhập đã hết hạn, bạn đăng nhập lại nhé.",
};

export async function addWorkoutAction(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return SIGNED_OUT;

  const parsed = WorkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  try {
    await insertWorkout(session.user.id, parsed.data);
  } catch (error) {
    console.error("[workouts/add]", error);
    return { ok: false, error: "Chưa lưu được bài tập, bạn thử lại nhé." };
  }
  refresh(); // re-render the page with fresh data from the database
  return { ok: true };
}

export async function updateWorkoutAction(id: string, input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return SIGNED_OUT;

  const parsed = WorkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  try {
    const updated = await updateWorkout(session.user.id, String(id), parsed.data);
    if (!updated) return { ok: false, error: "Không tìm thấy bài tập này." };
  } catch (error) {
    console.error("[workouts/update]", error);
    return { ok: false, error: "Chưa lưu được thay đổi, bạn thử lại nhé." };
  }
  refresh();
  return { ok: true };
}

export async function removeWorkoutAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return SIGNED_OUT;

  try {
    const deleted = await deleteWorkout(session.user.id, String(id));
    if (!deleted) return { ok: false, error: "Không tìm thấy bài tập này." };
  } catch (error) {
    console.error("[workouts/remove]", error);
    return { ok: false, error: "Chưa xoá được bài tập, bạn thử lại nhé." };
  }
  refresh();
  return { ok: true };
}
