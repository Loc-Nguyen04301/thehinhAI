"use client";

import { useMemo, useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import { addWorkoutAction, removeWorkoutAction } from "./actions";
import {
  COMMON_EXERCISES,
  MUSCLE_GROUPS,
  WorkoutInputSchema,
  volumeOf,
  type WorkoutEntry,
} from "./types";

const noopSubscribe = () => () => {};
// "en-CA" formats as YYYY-MM-DD in the user's local timezone.
const localToday = () => new Date().toLocaleDateString("en-CA");

/** Today's date on the client; "" on the server, which can't know the user's timezone. */
function useToday(): string {
  return useSyncExternalStore(noopSubscribe, localToday, () => "");
}

const numberFormat = new Intl.NumberFormat("vi-VN");
const dayFormat = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDay(date: string, today: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  const [ty, tm, td] = today.split("-").map(Number);
  const diffDays = Math.round((new Date(ty, tm - 1, td).getTime() - day.getTime()) / 86_400_000);
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return dayFormat.format(day);
}

function groupByDate(entries: WorkoutEntry[]): [string, WorkoutEntry[]][] {
  const groups = new Map<string, WorkoutEntry[]>();
  for (const entry of entries) {
    groups.set(entry.date, [...(groups.get(entry.date) ?? []), entry]);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

type OptimisticAction = { type: "add"; entry: WorkoutEntry } | { type: "remove"; id: string };

// Entries not yet confirmed by the server get a temporary id.
const PENDING_PREFIX = "pending-";

/** The signed-in user's own log: form + history. `entries` come from the server. */
export function WorkoutLogClient({ entries }: { entries: WorkoutEntry[] }) {
  const today = useToday();
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Show changes instantly; React swaps in the real server data once the action finishes.
  const [optimisticEntries, applyOptimistic] = useOptimistic(
    entries,
    (state, action: OptimisticAction) =>
      action.type === "add"
        ? [action.entry, ...state]
        : state.filter((entry) => entry.id !== action.id),
  );

  if (!today) {
    return <div className="h-96 animate-pulse rounded-2xl bg-card" aria-busy="true" />;
  }

  function handleAdd(input: unknown) {
    const parsed = WorkoutInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ, bạn kiểm tra lại nhé.");
      return false;
    }
    setError(null);
    startTransition(async () => {
      applyOptimistic({
        type: "add",
        entry: { ...parsed.data, id: `${PENDING_PREFIX}${Date.now()}`, createdAt: Date.now() },
      });
      const result = await addWorkoutAction(parsed.data);
      if (!result.ok) setError(result.error);
    });
    return true;
  }

  function handleRemove(entry: WorkoutEntry) {
    if (!confirm(`Xoá "${entry.exercise}" khỏi nhật ký?`)) return;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: entry.id });
      const result = await removeWorkoutAction(entry.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-8">
      <WorkoutForm today={today} entries={optimisticEntries} error={error} onAdd={handleAdd} />
      <WorkoutHistory today={today} entries={optimisticEntries} onRemove={handleRemove} />
    </div>
  );
}

/** Read-only history, e.g. for support staff looking at a user's log. */
export function WorkoutHistoryReadOnly({ entries }: { entries: WorkoutEntry[] }) {
  const today = useToday();
  if (!today) return <div className="h-40 animate-pulse rounded-2xl bg-card" aria-busy="true" />;
  return <WorkoutHistory today={today} entries={entries} />;
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-brand";

function WorkoutForm({
  today,
  entries,
  error,
  onAdd,
}: {
  today: string;
  entries: WorkoutEntry[];
  error: string | null;
  onAdd: (input: unknown) => boolean;
}) {
  const [date, setDate] = useState<string | null>(null);

  const exerciseSuggestions = useMemo(
    () => [...new Set([...entries.map((e) => e.exercise), ...COMMON_EXERCISES])],
    [entries],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const added = onAdd({
      date: date ?? today,
      exercise: data.get("exercise"),
      muscleGroup: data.get("muscleGroup"),
      sets: data.get("sets"),
      reps: data.get("reps"),
      weightKg: data.get("weightKg") || 0,
      note: data.get("note") || undefined,
    });
    if (!added) return;
    // Keep date, muscle group, sets and reps for the next exercise.
    for (const name of ["exercise", "weightKg", "note"]) {
      (form.elements.namedItem(name) as HTMLInputElement).value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6">
      <h2 className="text-lg font-bold">Ghi bài tập</h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm text-muted">Ngày</span>
          <input
            type="date"
            value={date ?? today}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted">Nhóm cơ</span>
          <select name="muscleGroup" className={inputClass} defaultValue={MUSCLE_GROUPS[0]}>
            {MUSCLE_GROUPS.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm text-muted">Bài tập</span>
        <input
          name="exercise"
          list="exercise-suggestions"
          placeholder="VD: Squat"
          autoComplete="off"
          className={inputClass}
          required
        />
        <datalist id="exercise-suggestions">
          {exerciseSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-sm text-muted">Số hiệp</span>
          <input name="sets" type="number" inputMode="numeric" min={1} defaultValue={3} className={inputClass} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted">Số lần</span>
          <input name="reps" type="number" inputMode="numeric" min={1} defaultValue={10} className={inputClass} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted">Mức tạ (kg)</span>
          <input name="weightKg" type="number" inputMode="decimal" min={0} step={0.5} placeholder="0" className={inputClass} />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm text-muted">Ghi chú (không bắt buộc)</span>
        <input name="note" maxLength={200} placeholder="VD: hiệp cuối hơi đuối" className={inputClass} />
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-brand py-3 font-semibold text-background transition-colors hover:bg-brand-hover active:bg-brand-dark"
      >
        Lưu bài tập
      </button>
    </form>
  );
}

function WorkoutHistory({
  today,
  entries,
  onRemove,
}: {
  today: string;
  entries: WorkoutEntry[];
  onRemove?: (entry: WorkoutEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
        {onRemove
          ? "Chưa có bài tập nào. Ghi bài đầu tiên để bắt đầu theo dõi tiến bộ nhé!"
          : "Chưa có bài tập nào."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {onRemove && <h2 className="text-lg font-bold">Lịch sử tập</h2>}
      {groupByDate(entries).map(([date, items]) => {
        const totalVolume = items.reduce((sum, e) => sum + volumeOf(e), 0);
        return (
          <section key={date} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold first-letter:uppercase">{formatDay(date, today)}</h3>
              <span className="text-sm text-muted">
                {items.length} bài · {numberFormat.format(totalVolume)} kg
              </span>
            </div>
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {items.map((entry) => (
                <WorkoutItem key={entry.id} entry={entry} onRemove={onRemove} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function WorkoutItem({
  entry,
  onRemove,
}: {
  entry: WorkoutEntry;
  onRemove?: (entry: WorkoutEntry) => void;
}) {
  const pending = entry.id.startsWith(PENDING_PREFIX);

  return (
    <li className={`flex items-start justify-between gap-3 p-4 ${pending ? "opacity-60" : ""}`}>
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">
          {entry.exercise}{" "}
          <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
            {entry.muscleGroup}
          </span>
        </p>
        <p className="text-sm text-muted">
          {entry.sets} hiệp × {entry.reps} lần ×{" "}
          {entry.weightKg > 0 ? `${numberFormat.format(entry.weightKg)} kg` : "tự trọng"}
          {entry.weightKg > 0 && ` · ${numberFormat.format(volumeOf(entry))} kg`}
        </p>
        {entry.note && <p className="text-sm italic text-muted">{entry.note}</p>}
      </div>
      {onRemove && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onRemove(entry)}
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted hover:bg-danger/10 hover:text-danger disabled:invisible"
        >
          Xoá
        </button>
      )}
    </li>
  );
}
