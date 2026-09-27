import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { MealLog } from "@/features/meal-logs/meal-log";

export const metadata: Metadata = {
  title: "Nhật ký ăn",
  description: "Ghi món ăn, khối lượng và kcal mỗi ngày, xem tổng kcal theo ngày hoặc theo khoảng ngày.",
};

export default async function MealLogsPage(props: PageProps<"/meal-logs">) {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Nhật ký ăn"
        subtitle="Tự ghi món ăn, khối lượng và kcal. Hệ thống cộng tổng kcal cho từng ngày."
      />
      <MealLog searchParams={await props.searchParams} />
    </div>
  );
}
