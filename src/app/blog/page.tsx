import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Kiến thức thể hình, dinh dưỡng và lịch tập dành cho người Việt.",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-6">
      <PageHeading title="Blog thể hình" subtitle="Kiến thức tập luyện và dinh dưỡng, ngắn gọn, dễ áp dụng." />
      {posts.length === 0 ? (
        <p className="text-muted">Chưa có bài viết nào. Bạn quay lại sau nhé!</p>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
