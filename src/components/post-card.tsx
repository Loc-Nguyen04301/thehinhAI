import Link from "next/link";
import { formatPostDate, type PostMeta } from "@/lib/blog";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand"
    >
      <time dateTime={post.date.toISOString()} className="text-xs text-muted">
        {formatPostDate(post.date)}
      </time>
      <h3 className="mt-1 text-lg font-bold leading-snug">{post.title}</h3>
      <p className="mt-2 text-sm text-muted">{post.description}</p>
      {post.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
