import type { MealResult } from "./schema";

const CONFIDENCE_LABEL: Record<MealResult["confidence"], string> = {
  low: "Độ tin cậy thấp",
  medium: "Độ tin cậy vừa",
  high: "Độ tin cậy cao",
};

const kcalFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const gramFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export function MealResultCard({ result }: { result: MealResult }) {
  const macros = [
    { label: "Đạm", value: result.total.protein },
    { label: "Tinh bột", value: result.total.carbs },
    { label: "Chất béo", value: result.total.fat },
  ];

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Tổng năng lượng ước tính</p>
          <p className="text-4xl font-extrabold text-brand">
            {kcalFormat.format(result.total.kcal)}{" "}
            <span className="text-lg font-semibold">kcal</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted">
          {CONFIDENCE_LABEL[result.confidence]}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {macros.map((macro) => (
          <div key={macro.label} className="rounded-xl bg-background p-3 text-center">
            <dt className="text-xs text-muted">{macro.label}</dt>
            <dd className="text-lg font-bold">{gramFormat.format(macro.value)} g</dd>
          </div>
        ))}
      </dl>

      <ul className="divide-y divide-border">
        {result.items.map((item, index) => (
          <li key={index} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted">{item.portion}</p>
              <p className="text-xs text-muted">
                Đạm {gramFormat.format(item.protein)} g · Carb {gramFormat.format(item.carbs)} g ·
                Béo {gramFormat.format(item.fat)} g
              </p>
            </div>
            <p className="shrink-0 font-semibold">{kcalFormat.format(item.kcal)} kcal</p>
          </li>
        ))}
      </ul>

      {result.notes && <p className="text-sm text-muted">{result.notes}</p>}

      <p className="border-t border-border pt-3 text-xs text-muted">
        AI ước tính, chỉ tham khảo. Số liệu thực tế phụ thuộc vào khẩu phần và cách chế biến.
      </p>
    </section>
  );
}
