import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { MealAnalyzer } from "@/features/meals/meal-analyzer";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Đo kcal bằng ảnh",
  description: "Chụp ảnh bữa ăn, AI ước tính kcal, đạm, tinh bột và chất béo trong vài giây.",
};

export default async function MealsPage() {
  await requireUser("/meals");

  return (
    <div className="space-y-6">
      <PageHeading
        title="Đo kcal bằng ảnh"
        subtitle="Chụp bữa ăn của bạn, AI sẽ ước tính năng lượng và chất dinh dưỡng."
      />
      <MealAnalyzer />
    </div>
  );
}
