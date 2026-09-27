import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { WorkoutLog } from "@/features/workouts/workout-log";

export const metadata: Metadata = {
  title: "Nhật ký tập",
  description: "Ghi lại bài tập, số hiệp, số lần và mức tạ để theo dõi tiến bộ mỗi ngày.",
};

export default function WorkoutsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Nhật ký tập"
        subtitle="Ghi nhanh từng bài ngay tại phòng tập. Dữ liệu được lưu vào tài khoản của bạn."
      />
      <WorkoutLog />
    </div>
  );
}
