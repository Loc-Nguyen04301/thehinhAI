import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { MealLog } from "@/features/meal-logs/meal-log";
import { MealAnalyzer } from "@/features/meals/meal-analyzer";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Đo kcal bằng ảnh",
  description:
    "Chụp ảnh bữa ăn, AI ước tính kcal, đạm, tinh bột và chất béo trong vài giây. Ghi nhật ký ăn để theo dõi tổng kcal mỗi ngày.",
};

export default async function MealsPage(props: PageProps<"/meals">) {
  await requireUser("/meals");
  const searchParams = await props.searchParams;

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <PageHeading
          title="Đo kcal bằng ảnh"
          subtitle="Chụp bữa ăn của bạn, AI sẽ ước tính năng lượng và chất dinh dưỡng."
        />
        <MealAnalyzer />
      </div>
      <div className="space-y-6 border-t border-border pt-8">
        <PageHeading
          as="h2"
          title="Nhật ký ăn hằng ngày"
          subtitle="Tự ghi món ăn, khối lượng và kcal. Hệ thống cộng tổng kcal cho từng ngày."
        />
        <MealLog searchParams={searchParams} />
      </div>
    </div>
  );
}
