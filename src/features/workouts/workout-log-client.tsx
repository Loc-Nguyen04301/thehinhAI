"use client";

import { useMemo, useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import { addWorkoutAction, removeWorkoutAction, updateWorkoutAction } from "./actions";
import {
  COMMON_EXERCISES,
  MAX_SETS,
  MUSCLE_GROUPS,
  WorkoutInputSchema,
  firstIssueMessage,
  volumeOf,
  type WorkoutEntry,
  type WorkoutInput,
  type WorkoutSet,
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

/** An entry as shown on screen; `pending` = change not yet confirmed by the server. */
type DisplayEntry = WorkoutEntry & { pending?: boolean };

function groupByDate(entries: DisplayEntry[]): [string, DisplayEntry[]][] {
  const groups = new Map<string, DisplayEntry[]>();
  for (const entry of entries) {
    groups.set(entry.date, [...(groups.get(entry.date) ?? []), entry]);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

type OptimisticAction =
  | { type: "add"; entry: DisplayEntry }
  | { type: "update"; entry: DisplayEntry }
  | { type: "remove"; id: string };

function applyChange(state: DisplayEntry[], action: OptimisticAction): DisplayEntry[] {
  switch (action.type) {
    case "add":
      return [action.entry, ...state];
    case "update":
      return state.map((entry) => (entry.id === action.entry.id ? action.entry : entry));
    case "remove":
      return state.filter((entry) => entry.id !== action.id);
  }
}

/** The signed-in user's own log: form + editable history. `entries` come from the server. */
export function WorkoutLogClient({ entries }: { entries: WorkoutEntry[] }) {
  const today = useToday();
  const [addError, setAddError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Show changes instantly; React swaps in the real server data once the action finishes.
  const [optimisticEntries, applyOptimistic] = useOptimistic<DisplayEntry[], OptimisticAction>(
    entries,
    applyChange,
  );

  const exerciseSuggestions = useMemo(
    () => [...new Set([...entries.map((e) => e.exercise), ...COMMON_EXERCISES])],
    [entries],
  );

  if (!today) {
    return <div className="h-96 animate-pulse rounded-2xl bg-card" aria-busy="true" />;
  }

  function handleAdd(input: WorkoutInput) {
    setAddError(null);
    startTransition(async () => {
      applyOptimistic({
        type: "add",
        entry: { ...input, id: `pending-${Date.now()}`, createdAt: Date.now(), pending: true },
      });
      const result = await addWorkoutAction(input);
      if (!result.ok) setAddError(result.error);
    });
  }

  function handleUpdate(entry: WorkoutEntry, input: WorkoutInput) {
    setEditingId(null);
    setHistoryError(null);
    startTransition(async () => {
      applyOptimistic({
        type: "update",
        entry: { ...input, id: entry.id, createdAt: entry.createdAt, pending: true },
      });
      const result = await updateWorkoutAction(entry.id, input);
      if (!result.ok) setHistoryError(result.error);
    });
  }

  function handleRemove(entry: WorkoutEntry) {
    if (!confirm(`Xoá "${entry.exercise}" khỏi nhật ký?`)) return;
    setHistoryError(null);
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: entry.id });
      const result = await removeWorkoutAction(entry.id);
      if (!result.ok) setHistoryError(result.error);
    });
  }

  return (
    <div className="space-y-8">
      {/* One suggestion list shared by the create form and the edit forms */}
      <datalist id="exercise-suggestions">
        {exerciseSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <WorkoutForm
        title="Ghi bài tập"
        submitLabel="Lưu bài tập"
        today={today}
        serverError={addError}
        onSubmit={handleAdd}
      />
      <WorkoutHistory
        today={today}
        entries={optimisticEntries}
        error={historyError}
        editingId={editingId}
        onEdit={(entry) => {
          setHistoryError(null);
          setEditingId(entry.id);
        }}
        onCancelEdit={() => setEditingId(null)}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
      />
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

/** A set row being edited: input values are kept as strings until validation. */
type SetRow = { key: number; reps: string; weightKg: string };

let nextRowKey = 0;
const newRow = (reps: string, weightKg: string): SetRow => ({ key: nextRowKey++, reps, weightKg });
const rowsFrom = (sets: WorkoutSet[]) =>
  sets.map((set) => newRow(String(set.reps), set.weightKg ? String(set.weightKg) : ""));

/** Create form (no `initial`) or edit form (prefilled from `initial`). */
function WorkoutForm({
  title,
  submitLabel,
  today,
  initial,
  serverError,
  onSubmit,
  onCancel,
}: {
  title?: string;
  submitLabel: string;
  today: string;
  initial?: WorkoutEntry;
  serverError?: string | null;
  onSubmit: (input: WorkoutInput) => void;
  onCancel?: () => void;
}) {
  const [date, setDate] = useState<string | null>(initial?.date ?? null);
  const [rows, setRows] = useState<SetRow[]>(() =>
    initial ? rowsFrom(initial.sets) : [newRow("10", "")],
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = WorkoutInputSchema.safeParse({
      date: date ?? today,
      exercise: data.get("exercise"),
      muscleGroup: data.get("muscleGroup"),
      sets: rows.map((row) => ({ reps: row.reps, weightKg: row.weightKg || 0 })),
      note: data.get("note") || undefined,
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }
    setError(null);
    onSubmit(parsed.data);
    if (!initial) {
      // Create form: keep date, muscle group and the sets' reps for the next exercise.
      for (const name of ["exercise", "note"]) {
        (form.elements.namedItem(name) as HTMLInputElement).value = "";
      }
      setRows(rows.map((row) => newRow(row.reps, "")));
    }
  }

  const shownError = error ?? serverError;
  const editing = Boolean(initial);

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape" && onCancel) onCancel();
      }}
      aria-label={editing ? `Sửa bài tập ${initial?.exercise}` : undefined}
      className={
        editing
          ? "space-y-4 p-4"
          : "space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6"
      }
    >
      {title && <h2 className="text-lg font-bold">{title}</h2>}

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
          <select
            name="muscleGroup"
            className={inputClass}
            defaultValue={initial?.muscleGroup ?? MUSCLE_GROUPS[0]}
          >
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
          defaultValue={initial?.exercise}
          className={inputClass}
          required
        />
      </label>

      <SetsEditor rows={rows} onChange={setRows} />

      <label className="block space-y-1">
        <span className="text-sm text-muted">Ghi chú (không bắt buộc)</span>
        <input
          name="note"
          maxLength={200}
          placeholder="VD: hiệp cuối hơi đuối"
          defaultValue={initial?.note}
          className={inputClass}
        />
      </label>

      {shownError && (
        <p role="alert" className="text-sm text-danger">
          {shownError}
        </p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-3 font-semibold transition-colors hover:border-brand hover:text-brand"
          >
            Huỷ
          </button>
        )}
        <button
          type="submit"
          className="flex-1 rounded-xl bg-brand py-3 font-semibold text-background transition-colors hover:bg-brand-hover active:bg-brand-dark"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

const setGridClass = "grid grid-cols-[4rem_1fr_1fr_2.25rem] items-center gap-2";

/** One row per set with its own reps and weight. "+ Thêm hiệp" copies the last set. */
function SetsEditor({ rows, onChange }: { rows: SetRow[]; onChange: (rows: SetRow[]) => void }) {
  function update(key: number, field: "reps" | "weightKg", value: string) {
    onChange(rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  }

  function addSet() {
    const last = rows[rows.length - 1];
    onChange([...rows, newRow(last?.reps ?? "10", last?.weightKg ?? "")]);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm text-muted">Các hiệp ({rows.length})</legend>
      <div className={`${setGridClass} text-xs text-muted`} aria-hidden="true">
        <span />
        <span>Số lần</span>
        <span>Mức tạ (kg)</span>
        <span />
      </div>
      {rows.map((row, index) => (
        <div key={row.key} className={setGridClass}>
          <span className="text-sm font-medium">Hiệp {index + 1}</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={row.reps}
            onChange={(e) => update(row.key, "reps", e.target.value)}
            aria-label={`Số lần hiệp ${index + 1}`}
            className={inputClass}
            required
          />
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            placeholder="0"
            value={row.weightKg}
            onChange={(e) => update(row.key, "weightKg", e.target.value)}
            aria-label={`Mức tạ hiệp ${index + 1} (kg)`}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
            disabled={rows.length === 1}
            aria-label={`Xoá hiệp ${index + 1}`}
            className="flex size-9 items-center justify-center rounded-lg text-xl leading-none text-muted hover:bg-danger/10 hover:text-danger disabled:invisible"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addSet}
        disabled={rows.length >= MAX_SETS}
        className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm font-semibold text-brand transition-colors hover:border-brand disabled:opacity-40"
      >
        + Thêm hiệp
      </button>
      <p className="text-xs text-muted">Để trống mức tạ nếu tập với trọng lượng cơ thể.</p>
    </fieldset>
  );
}

function formatSet(set: WorkoutSet): string {
  return set.weightKg > 0
    ? `${set.reps} lần × ${numberFormat.format(set.weightKg)} kg`
    : `${set.reps} lần tự trọng`;
}

/** "3 hiệp × 10 lần × 60 kg" when sets repeat; "10 lần × 60 kg · 8 lần × 70 kg" otherwise. */
function describeSets(sets: WorkoutSet[]): string {
  const groups: { set: WorkoutSet; count: number }[] = [];
  for (const set of sets) {
    const last = groups[groups.length - 1];
    if (last && last.set.reps === set.reps && last.set.weightKg === set.weightKg) last.count++;
    else groups.push({ set, count: 1 });
  }
  return groups
    .map(({ set, count }) => (count > 1 ? `${count} hiệp × ${formatSet(set)}` : formatSet(set)))
    .join(" · ");
}

function WorkoutHistory({
  today,
  entries,
  error,
  editingId,
  onEdit,
  onCancelEdit,
  onUpdate,
  onRemove,
}: {
  today: string;
  entries: DisplayEntry[];
  error?: string | null;
  editingId?: string | null;
  onEdit?: (entry: WorkoutEntry) => void;
  onCancelEdit?: () => void;
  onUpdate?: (entry: WorkoutEntry, input: WorkoutInput) => void;
  onRemove?: (entry: WorkoutEntry) => void;
}) {
  const editable = Boolean(onEdit && onUpdate && onRemove);

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
        {editable
          ? "Chưa có bài tập nào. Ghi bài đầu tiên để bắt đầu theo dõi tiến bộ nhé!"
          : "Chưa có bài tập nào."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {editable && (
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Lịch sử tập</h2>
          <p className="text-sm text-muted">Chạm vào một bài để sửa.</p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
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
              {items.map((entry) =>
                editable && entry.id === editingId ? (
                  <li key={entry.id} className="bg-background/60">
                    <WorkoutForm
                      submitLabel="Lưu thay đổi"
                      today={today}
                      initial={entry}
                      onSubmit={(input) => onUpdate!(entry, input)}
                      onCancel={onCancelEdit}
                    />
                  </li>
                ) : (
                  <WorkoutItem
                    key={entry.id}
                    entry={entry}
                    onEdit={editable ? onEdit : undefined}
                    onRemove={editable ? onRemove : undefined}
                  />
                ),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function WorkoutItem({
  entry,
  onEdit,
  onRemove,
}: {
  entry: DisplayEntry;
  onEdit?: (entry: WorkoutEntry) => void;
  onRemove?: (entry: WorkoutEntry) => void;
}) {
  const details = (
    <>
      <p className="font-medium">
        {entry.exercise}{" "}
        <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
          {entry.muscleGroup}
        </span>
      </p>
      <p className="text-sm text-muted">
        {describeSets(entry.sets)}
        {volumeOf(entry) > 0 && ` · tổng ${numberFormat.format(volumeOf(entry))} kg`}
      </p>
      {entry.note && <p className="text-sm italic text-muted">{entry.note}</p>}
    </>
  );

  return (
    <li className={`flex items-start gap-3 p-4 ${entry.pending ? "opacity-60" : ""}`}>
      {onEdit ? (
        <button
          type="button"
          disabled={entry.pending}
          onClick={() => onEdit(entry)}
          aria-label={`Sửa bài tập ${entry.exercise}`}
          className="-m-2 min-w-0 flex-1 space-y-0.5 rounded-xl p-2 text-left transition-colors hover:bg-background disabled:cursor-default disabled:hover:bg-transparent"
        >
          {details}
        </button>
      ) : (
        <div className="min-w-0 flex-1 space-y-0.5">{details}</div>
      )}
      {onRemove && (
        <button
          type="button"
          disabled={entry.pending}
          onClick={() => onRemove(entry)}
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted hover:bg-danger/10 hover:text-danger disabled:invisible"
        >
          Xoá
        </button>
      )}
    </li>
  );
}
