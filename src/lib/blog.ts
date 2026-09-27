import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { z } from "zod";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SLUG_PATTERN = /^[a-z0-9-]+$/;

const FrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

export type PostMeta = z.infer<typeof FrontmatterSchema> & { slug: string };
export type Post = PostMeta & { html: string };

async function readPost(slug: string): Promise<Post> {
  const file = await fs.readFile(path.join(BLOG_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(file);
  const parsed = FrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in content/blog/${slug}.md: ${parsed.error.message}`);
  }
  // Markdown comes from our own repo, so rendering it as HTML is trusted.
  const html = await marked.parse(content);
  return { ...parsed.data, slug, html };
}

async function listSlugs(): Promise<string[]> {
  const files = await fs.readdir(BLOG_DIR);
  const slugs = files.filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
  const invalid = slugs.filter((s) => !SLUG_PATTERN.test(s));
  if (invalid.length > 0) {
    throw new Error(`Blog file names must match a-z0-9- (no Vietnamese accents): ${invalid.join(", ")}`);
  }
  return slugs;
}

/** Published posts, newest first. */
export async function getAllPosts(): Promise<PostMeta[]> {
  const posts = await Promise.all((await listSlugs()).map(readPost));
  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((post) => {
      const meta: PostMeta & { html?: string } = { ...post };
      delete meta.html;
      return meta;
    });
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  try {
    const post = await readPost(slug);
    return post.draft ? null : post;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC", // frontmatter dates are parsed as UTC midnight
});

export function formatPostDate(date: Date): string {
  return dateFormatter.format(date);
}
