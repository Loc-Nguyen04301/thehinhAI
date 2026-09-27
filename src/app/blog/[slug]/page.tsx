import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPostDate, getAllPosts, getPost } from "@/lib/blog";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: { type: "article", title: post.title, description: post.description },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="space-y-6">
      <Link href="/blog" className="text-sm text-muted hover:text-brand">
        ← Tất cả bài viết
      </Link>
      <header className="space-y-2">
        <time dateTime={post.date.toISOString()} className="text-sm text-muted">
          {formatPostDate(post.date)}
        </time>
        <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{post.title}</h1>
        <p className="text-muted">{post.description}</p>
      </header>
      <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  );
}
