import Image from "next/image";
import Link from "next/link";
import { NavIconSvg } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { Wordmark } from "@/components/site-header";
import { getAllPosts } from "@/lib/blog";
import { siteConfig, type NavIcon } from "@/lib/site";

const features: { href: string; icon: NavIcon; title: string; description: string }[] = [
  {
    href: "/meals",
    icon: "camera",
    title: "Đo kcal bằng ảnh",
    description: "Chụp bữa ăn, AI ước tính kcal, đạm, tinh bột, chất béo. Hiểu món Việt.",
  },
  {
    href: "/workouts",
    icon: "dumbbell",
    title: "Nhật ký tập",
    description: "Ghi bài tập, số hiệp, số lần, mức tạ ngay tại phòng gym và xem tiến bộ.",
  },
  {
    href: "/blog",
    icon: "book",
    title: "Blog thể hình",
    description: "Kiến thức tập luyện và dinh dưỡng ngắn gọn, dễ áp dụng.",
  },
];

export default async function HomePage() {
  const latestPosts = (await getAllPosts()).slice(0, 3);

  return (
    <div className="space-y-14">
      <section className="flex flex-col items-center text-center">
        <Image
          src={siteConfig.logo.src}
          alt={`Logo ${siteConfig.name}`}
          width={siteConfig.logo.width}
          height={siteConfig.logo.height}
          priority
          sizes="(min-width: 768px) 320px, 256px"
          className="h-auto w-64 md:w-80"
        />
        <Wordmark className="mt-3 text-5xl md:text-6xl" />
        <h1 className="mt-6 text-3xl font-extrabold leading-tight md:text-5xl">
          Tập để khoẻ đẹp{" "}
          <span className="bg-linear-to-r from-brand-light to-brand-dark bg-clip-text text-transparent">
            mỗi ngày
          </span>
        </h1>
        <p className="mt-3 max-w-md text-muted">
          Ghi nhật ký tập, đo kcal bữa ăn bằng ảnh với AI và học kiến thức thể hình, tất cả ở
          một nơi.
        </p>
        <div className="mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Link
            href="/meals"
            className="flex-1 rounded-xl bg-brand py-3 font-semibold text-background transition-colors hover:bg-brand-light active:bg-brand-dark"
          >
            Đo kcal bữa ăn
          </Link>
          <Link
            href="/workouts"
            className="flex-1 rounded-xl border border-border py-3 font-semibold transition-colors hover:border-brand hover:text-brand"
          >
            Ghi buổi tập
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand"
          >
            <NavIconSvg name={feature.icon} className="size-8 text-brand" />
            <h2 className="mt-3 font-bold">{feature.title}</h2>
            <p className="mt-1 text-sm text-muted">{feature.description}</p>
          </Link>
        ))}
      </section>

      {latestPosts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Bài viết mới</h2>
            <Link href="/blog" className="text-sm text-brand hover:text-brand-light">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid gap-4">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
