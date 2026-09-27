"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import {
  DateRangeFilter,
  TruncatedRangeNote,
  isInRange,
  rangeLabel,
  shownRange,
  useRangeNavigation,
} from "@/components/date-range-filter";
import { formatDay, groupByDate, numberFormat, useToday } from "@/lib/date";
import type { DateRange } from "@/lib/date-range";
import { addMealLogAction, removeMealLogAction, updateMealLogAction } from "./actions";
import {
  MealLogInputSchema,
  firstIssueMessage,
  totalKcal,
  type MealLogEntry,
  type MealLogInput,
} from "./types";

/** An entry as shown on screen; `pending` = change not yet confirmed by the server. */
type DisplayEntry = MealLogEntry & { pending?: boolean };

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

/**
 * The signed-in user's own kcal log: today's total + form + editable history.
 * `range` comes from the URL (null = last 7 days); `entries` covers it and today.
 */
export function MealLogClient({
  entries,
  range,
  truncated,
}: {
  entries: MealLogEntry[];
  range: DateRange | null;
  truncated: boolean;
}) {
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

  const nameSuggestions = useMemo(() => [...new Set(entries.map((e) => e.name))], [entries]);

  if (!today) {
    return <div className="h-96 animate-pulse rounded-2xl bg-card" aria-busy="true" />;
  }

  // Looked up by id so the dialog closes by itself if the entry disappears
  const editingEntry = optimisticEntries.find((entry) => entry.id === editingId);
  const todayEntries = optimisticEntries.filter((entry) => entry.date === today);

  function handleAdd(input: MealLogInput) {
    setAddError(null);
    startTransition(async () => {
      applyOptimistic({
        type: "add",
        entry: { ...input, id: `pending-${Date.now()}`, createdAt: Date.now(), pending: true },
      });
      const result = await addMealLogAction(input);
      if (!result.ok) setAddError(result.error);
    });
  }

  function handleUpdate(entry: MealLogEntry, input: MealLogInput) {
    setHistoryError(null);
    startTransition(async () => {
      applyOptimistic({
        type: "update",
        entry: { ...input, id: entry.id, createdAt: entry.createdAt, pending: true },
      });
      const result = await updateMealLogAction(entry.id, input);
      if (!result.ok) setHistoryError(result.error);
    });
  }

  function handleRemove(entry: MealLogEntry) {
    if (!confirm(`Xoá "${entry.name}" khỏi nhật ký ăn?`)) return;
    setHistoryError(null);
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: entry.id });
      const result = await removeMealLogAction(entry.id);
      if (!result.ok) setHistoryError(result.error);
    });
  }

  return (
    <div className="space-y-8">
      {/* One suggestion list (foods logged before) shared by the create and edit forms */}
      <datalist id="meal-name-suggestions">
        {nameSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <TodaySummary entries={todayEntries} />
      <MealLogForm
        title="Ghi món ăn"
        submitLabel="Lưu món ăn"
        today={today}
        serverError={addError}
        onSubmit={handleAdd}
      />
      {/* `entries` always includes the latest foods, so empty = nothing logged yet */}
      {optimisticEntries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
          Chưa có món ăn nào. Ghi món đầu tiên để bắt đầu theo dõi kcal mỗi ngày nhé!
        </p>
      ) : (
        <MealLogHistory
          today={today}
          range={range}
          entries={optimisticEntries}
          truncated={truncated}
          error={historyError}
          onEdit={(entry) => {
            setHistoryError(null);
            setEditingId(entry.id);
          }}
          onRemove={handleRemove}
        />
      )}
      {editingEntry && (
        <EditMealLogDialog
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

function TodaySummary({ entries }: { entries: DisplayEntry[] }) {
  return (
    <section
      aria-live="polite"
      className="flex items-end justify-between gap-3 rounded-2xl border border-border bg-card p-4 md:p-6"
    >
      <div>
        <p className="text-sm text-muted">Tổng kcal hôm nay</p>
        <p className="text-4xl font-extrabold text-brand">
          {numberFormat.format(totalKcal(entries))}{" "}
          <span className="text-lg font-semibold">kcal</span>
        </p>
      </div>
      <p className="shrink-0 text-sm text-muted">
        {entries.length > 0 ? `${entries.length} món` : "Chưa ghi món nào"}
      </p>
    </section>
  );
}

/**
 * Edit form in a modal <dialog>: the page behind is dimmed and inert, Esc closes it,
 * and focus returns to the entry that was tapped. Kept separate from the create form
 * so the two can't be confused.
 */
function EditMealLogDialog({
  entry,
  today,
  onSave,
  onClose,
}: {
  entry: MealLogEntry;
  today: string;
  onSave: (input: MealLogInput) => void;
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
      aria-labelledby="edit-meal-log-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <h2 id="edit-meal-log-title" className="text-lg font-bold">
            Sửa món ăn
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
        <MealLogForm
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

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-brand";

/** Create form (no `initial`) or edit form (prefilled from `initial`). */
function MealLogForm({
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
  initial?: MealLogEntry;
  serverError?: string | null;
  onSubmit: (input: MealLogInput) => void;
  onCancel?: () => void;
}) {
  const [date, setDate] = useState<string | null>(initial?.date ?? null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = MealLogInputSchema.safeParse({
      date: date ?? today,
      name: data.get("name"),
      grams: data.get("grams"),
      kcal: data.get("kcal"),
      note: data.get("note") || undefined,
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed.error));
      return;
    }
    setError(null);
    onSubmit(parsed.data);
    if (!initial) {
      // Create form: keep the date for the next food of the same day.
      for (const name of ["name", "grams", "kcal", "note"]) {
        (form.elements.namedItem(name) as HTMLInputElement).value = "";
      }
    }
  }

  const shownError = error ?? serverError;
  const editing = Boolean(initial);

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={editing ? `Sửa món ăn ${initial?.name}` : undefined}
      className={
        editing
          ? "space-y-4 p-4"
          : "space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6"
      }
    >
      {title && <h2 className="text-lg font-bold">{title}</h2>}

      <label className="block space-y-1">
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

      <label className="block space-y-1">
        <span className="text-sm text-muted">Tên món ăn</span>
        <input
          name="name"
          list="meal-name-suggestions"
          placeholder="VD: Cơm gà luộc"
          autoComplete="off"
          maxLength={80}
          defaultValue={initial?.name}
          className={inputClass}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm text-muted">Khối lượng (g)</span>
          <input
            name="grams"
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            placeholder="VD: 350"
            defaultValue={initial?.grams}
            className={inputClass}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted">Năng lượng (kcal)</span>
          <input
            name="kcal"
            type="number"
            inputMode="numeric"
            min={0}
            max={5000}
            placeholder="VD: 550"
            defaultValue={initial?.kcal}
            className={inputClass}
            required
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm text-muted">Ghi chú (không bắt buộc)</span>
        <input
          name="note"
          maxLength={200}
          placeholder="VD: bữa trưa, ít cơm"
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

/** History of one date range: range picker + the range's total kcal + foods grouped by day. */
function MealLogHistory({
  today,
  range,
  entries,
  truncated,
  error,
  onEdit,
  onRemove,
}: {
  today: string;
  /** From the URL; null = last 7 days. */
  range: DateRange | null;
  entries: DisplayEntry[];
  truncated: boolean;
  error?: string | null;
  onEdit: (entry: MealLogEntry) => void;
  onRemove: (entry: MealLogEntry) => void;
}) {
  const { loading, showRange } = useRangeNavigation();
  const shown = shownRange(range, today);
  const inRange = entries.filter((entry) => isInRange(entry.date, shown));
  const days = groupByDate(inRange);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">Lịch sử ăn uống</h2>
        <p className="text-sm text-muted">
          Chọn khoảng ngày để xem tổng kcal. Chạm vào một món để sửa.
        </p>
      </div>

      <DateRangeFilter today={today} range={range} loading={loading} onChange={showRange}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted">Tổng kcal · {rangeLabel(range)}</p>
            <p className="text-3xl font-extrabold text-brand">
              {numberFormat.format(totalKcal(inRange))}{" "}
              <span className="text-base font-semibold">kcal</span>
            </p>
          </div>
          <p className="shrink-0 text-right text-sm text-muted">
            {inRange.length} món
            <br />
            {days.length} ngày có ghi
          </p>
        </div>
      </DateRangeFilter>

      {truncated && <TruncatedRangeNote />}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
        {days.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
            Không có món nào trong khoảng ngày này.
          </p>
        ) : (
          days.map(([date, items]) => (
            <section key={date} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold first-letter:uppercase">{formatDay(date, today)}</h3>
                <span className="text-sm text-muted">
                  {items.length} món · Tổng{" "}
                  <span className="font-semibold text-brand">
                    {numberFormat.format(totalKcal(items))} kcal
                  </span>
                </span>
              </div>
              <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                {items.map((entry) => (
                  <MealLogItem key={entry.id} entry={entry} onEdit={onEdit} onRemove={onRemove} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function MealLogItem({
  entry,
  onEdit,
  onRemove,
}: {
  entry: DisplayEntry;
  onEdit: (entry: MealLogEntry) => void;
  onRemove: (entry: MealLogEntry) => void;
}) {
  return (
    <li className={`flex items-center gap-3 p-4 ${entry.pending ? "opacity-60" : ""}`}>
      <button
        type="button"
        disabled={entry.pending}
        onClick={() => onEdit(entry)}
        aria-label={`Sửa món ăn ${entry.name}`}
        className="-m-2 flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl p-2 text-left transition-colors hover:bg-background disabled:cursor-default disabled:hover:bg-transparent"
      >
        {/* <span>s (not <p>/<div>) because they sit inside a <button> */}
        <span className="min-w-0">
          <span className="block truncate font-medium">{entry.name}</span>
          <span className="block text-sm text-muted">{numberFormat.format(entry.grams)} g</span>
          {entry.note && (
            <span className="mt-0.5 block text-sm wrap-break-word italic text-muted">{entry.note}</span>
          )}
        </span>
        <span className="shrink-0 font-semibold">{numberFormat.format(entry.kcal)} kcal</span>
      </button>
      <button
        type="button"
        disabled={entry.pending}
        onClick={() => onRemove(entry)}
        className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted hover:bg-danger/10 hover:text-danger disabled:invisible"
      >
        Xoá
      </button>
    </li>
  );
}
