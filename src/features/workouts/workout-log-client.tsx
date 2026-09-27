"use client";

import { Fragment, useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { formatDay, numberFormat, useToday } from "@/lib/date";
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

  // Looked up by id so the dialog closes by itself if the entry disappears
  const editingEntry = optimisticEntries.find((entry) => entry.id === editingId);

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
        onEdit={(entry) => {
          setHistoryError(null);
          setEditingId(entry.id);
        }}
        onRemove={handleRemove}
      />
      {editingEntry && (
        <EditWorkoutDialog
          key={editingEntry.id}
          entry={editingEntry}
          today={today}
          onSave={(input) => handleUpdate(editingEntry, input)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

/**
 * Edit form in a modal <dialog>: the page behind is dimmed and inert, Esc closes it,
 * and focus returns to the entry that was tapped. Kept separate from the create form
 * so the two can't be confused.
 */
function EditWorkoutDialog({
  entry,
  today,
  onSave,
  onClose,
}: {
  entry: WorkoutEntry;
  today: string;
  onSave: (input: WorkoutInput) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close(); // fires `close` → onClose

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // A click on the dialog element itself (not its content) is a click on the backdrop
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby="edit-workout-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <h2 id="edit-workout-title" className="text-lg font-bold">
            Sửa bài tập
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="flex size-9 items-center justify-center rounded-full text-2xl leading-none text-muted hover:bg-card hover:text-foreground"
          >
            ×
          </button>
        </header>
        <WorkoutForm
          submitLabel="Lưu thay đổi"
          today={today}
          initial={entry}
          onSubmit={(input) => {
            onSave(input);
            close();
          }}
          onCancel={close}
        />
      </div>
    </dialog>
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
    : `${set.reps} lần · tự trọng`;
}

/** Consecutive identical sets share one line: sets 1–3 → "Hiệp 1–3". */
function groupSets(sets: WorkoutSet[]): { label: string; set: WorkoutSet }[] {
  const groups: { from: number; to: number; set: WorkoutSet }[] = [];
  sets.forEach((set, index) => {
    const last = groups[groups.length - 1];
    if (last && last.set.reps === set.reps && last.set.weightKg === set.weightKg) last.to = index + 1;
    else groups.push({ from: index + 1, to: index + 1, set });
  });
  return groups.map(({ from, to, set }) => ({
    label: from === to ? `Hiệp ${from}` : `Hiệp ${from}–${to}`,
    set,
  }));
}

function WorkoutHistory({
  today,
  entries,
  error,
  onEdit,
  onRemove,
}: {
  today: string;
  entries: DisplayEntry[];
  error?: string | null;
  onEdit?: (entry: WorkoutEntry) => void;
  onRemove?: (entry: WorkoutEntry) => void;
}) {
  const editable = Boolean(onEdit && onRemove);

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
              {items.map((entry) => (
                <WorkoutItem key={entry.id} entry={entry} onEdit={onEdit} onRemove={onRemove} />
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
  onEdit,
  onRemove,
}: {
  entry: DisplayEntry;
  onEdit?: (entry: WorkoutEntry) => void;
  onRemove?: (entry: WorkoutEntry) => void;
}) {
  const volume = volumeOf(entry);
  // <span>s (not <p>/<div>) because this also sits inside a <button>
  const details = (
    <>
      <span className="block font-medium">
        {entry.exercise}{" "}
        <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
          {entry.muscleGroup}
        </span>
      </span>
      {/* One line per set (identical consecutive sets grouped), total on its own line */}
      <span className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
        {groupSets(entry.sets).map(({ label, set }) => (
          <Fragment key={label}>
            <span className="text-muted">{label}</span>
            <span>{formatSet(set)}</span>
          </Fragment>
        ))}
      </span>
      {volume > 0 && (
        <span className="mt-1 block text-sm text-muted">
          Tổng khối lượng:{" "}
          <span className="font-semibold text-foreground">{numberFormat.format(volume)} kg</span>
        </span>
      )}
      {entry.note && <span className="mt-1 block text-sm italic text-muted">{entry.note}</span>}
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
          className="-m-2 min-w-0 flex-1 rounded-xl p-2 text-left transition-colors hover:bg-background disabled:cursor-default disabled:hover:bg-transparent"
        >
          {details}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{details}</div>
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
