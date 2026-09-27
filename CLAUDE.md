@AGENTS.md

# thehinhAI — CLAUDE.md

> Slogan: **"Tập để khoẻ đẹp mỗi ngày"**
> Website thể hình tích hợp AI cho người Việt: nhật ký tập, đo kcal bữa ăn bằng ảnh, blog thể hình.

## Định hướng dự án

- Mục tiêu: phát triển bộ môn **thể hình** cho người Việt, trong đó **AI là trợ lý** giúp người dùng trong suốt quá trình dùng ứng dụng.
- AI phục vụ việc tập luyện, không phải tính năng trang trí: giúp người dùng ghi chép nhanh hơn, hiểu số liệu của mình, biết nên làm gì tiếp theo (ví dụ: đo kcal từ ảnh, nhận xét buổi tập, gợi ý lịch tập).
- Khi thiết kế tính năng mới, luôn xem xét AI có thể hỗ trợ người dùng ở bước nào. Nhưng tính năng cốt lõi vẫn phải dùng được khi AI lỗi hoặc chậm.

## Thương hiệu

- **Tên thương hiệu:** `thehinhAI` — viết đúng nguyên văn (liền, "thehinh" viết thường, "AI" viết hoa). Tên cũ "Thể hình Daily-AI" đã bỏ, **không dùng chữ "daily"** ở bất cứ đâu. Trong code chỉ lấy tên từ `siteConfig.name` (`src/lib/site.ts`), không gõ lại trong component.
- **Wordmark (tên dạng chữ):** `thehinh` màu trắng + `AI` màu `brand`, chữ đậm nghiêng — component `Wordmark` trong `site-header.tsx` (header và hero đều dùng).
- **Logo biểu tượng:** `public/brand/logo-mark.png` (`siteConfig.logo`) — 770×540, hình người tập tạ + chip "AI", nền đen liền (không trong suốt), **không có chữ**. Hero = logo biểu tượng + `Wordmark`.
  - Luôn hiển thị bằng `next/image`. Chỉ đặt trên nền đen (`bg-background`); không kéo méo, đổi màu hay thêm hiệu ứng.
  - Icon tab/điện thoại: `src/app/icon.png` (512px) và `apple-icon.png` (180px), cắt từ cùng phần biểu tượng.
- `public/brand/logo.png` là **logo cũ** (còn chữ `thehinhdaily-ai` và tagline) — chỉ giữ làm file gốc để cắt biểu tượng, **không hiển thị trên web**. Chờ bộ logo mới (xem Lộ trình).

### Bảng màu

| Token | Mã | Dùng cho |
| --- | --- | --- |
| `--brand` | `#05A8FA` | Màu chính: nút CTA, link, icon đang chọn, số liệu nổi bật |
| `--brand-light` | `#08CAFA` | Hover, glow, đầu sáng của gradient |
| `--brand-dark` | `#0470F0` | Trạng thái nhấn (active), đầu đậm của gradient |
| `--background` | `#000000` | Nền trang |
| `--foreground` | `#FFFFFF` | Chữ chính |

Khai báo trong `src/app/globals.css` (Tailwind v4 tự sinh class `bg-brand`, `text-brand-light`, `from-brand-light`...):

```css
:root {
  --brand: #05A8FA;
  --brand-light: #08CAFA;
  --brand-dark: #0470F0;
  --background: #000000;
  --foreground: #FFFFFF;
}

@theme inline {
  --color-brand: var(--brand);
  --color-brand-light: var(--brand-light);
  --color-brand-dark: var(--brand-dark);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

- **Nền tối là giao diện mặc định** (theo logo). Token phụ `--card`, `--border`, `--muted` là sắc xám trung tính trên nền đen; `--danger` chỉ dùng cho thông báo lỗi. Không thêm màu mới ngoài các token này.
- Gradient thương hiệu (vòng cung trong logo): `bg-linear-to-r from-brand-light to-brand-dark`.
- **Chữ trên nền `bg-brand` dùng màu đen** (`text-background`): chữ trắng trên `#05A8FA` chỉ đạt tương phản ~2.6:1, khó đọc. Ngược lại, chữ `text-brand` trên nền đen đạt ~8:1, dùng thoải mái.

## Ngôn ngữ & giọng văn

- Trả lời chủ dự án (Lộc) bằng **tiếng Việt**. Code, tên biến, tên file, commit message: **tiếng Anh**.
- Mọi text hiển thị cho người dùng cuối: **tiếng Việt có dấu**, giọng thân thiện, ngắn gọn, khích lệ (xưng "bạn").
- Chủ dự án mạnh JS/web nhưng mới với Next.js App Router — khi làm việc lớn, giải thích ngắn *tại sao* chọn cách làm đó.

## Tech stack

| Thành phần | Lựa chọn |
| --- | --- |
| Framework | Next.js 16 (App Router, `src/` dir) + React 19 |
| Ngôn ngữ | TypeScript strict |
| Styling | Tailwind CSS v4 (cấu hình trong `src/app/globals.css`, không có `tailwind.config`) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`), gọi **chỉ từ server** |
| Database | MongoDB Atlas, driver chính thức `mongodb` (không dùng Mongoose — schema đã có zod) |
| Xác thực | Better Auth: email + mật khẩu, Google; plugin `admin` cho role/quyền |
| Validate | zod v4 |
| Blog | Markdown trong `content/blog/*.md` + `gray-matter` + `marked` |
| Font | Be Vietnam Pro (`next/font/google`, subset `vietnamese`) |

**Next.js 16 khác bản cũ** — đọc `node_modules/next/dist/docs/` trước khi dùng API lạ. Lưu ý quan trọng:
- `params` / `searchParams` là **Promise** → `const { slug } = await props.params`.
- Dùng helper type global `PageProps<"/route">`, `LayoutProps<"/route">`, `RouteContext<"/route">`.

## Lệnh thường dùng

```bash
npm run dev        # http://localhost:3000
npm run build      # build production — chạy trước khi báo "xong"
npm run lint       # ESLint
npx next typegen   # sinh type PageProps/LayoutProps/RouteContext (cần trước tsc nếu chưa chạy dev/build)
npx tsc --noEmit   # kiểm tra type
npm run set-role -- <email> <user|cs|admin>   # cấp role (VD admin đầu tiên) — đọc .env.local
```

Biến môi trường: copy `.env.example` → `.env.local` (giải thích từng biến trong file đó). Bắt buộc: `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Không bắt buộc: `GOOGLE_CLIENT_ID/SECRET` (thiếu thì ẩn nút Google), `ANTHROPIC_API_KEY` (thiếu thì chỉ Đo kcal lỗi).
`next build` **không cần** biến môi trường nào: DB và auth được khởi tạo lười (`getMongoClient()`, `getAuth()`).

## Cấu trúc thư mục

```
content/blog/               # Bài blog Markdown (frontmatter: title, description, date, tags, draft?)
public/brand/logo-mark.png  # Logo biểu tượng (không chữ) — logo.png là logo cũ, không dùng
scripts/set-role.mts        # CLI cấp role (npm run set-role)
src/
  app/                      # Chỉ routing: page/layout/route mỏng, gọi sang features/
    layout.tsx              # Font, metadata, header + footer + thanh tab dưới (mobile)
    error.tsx               # Trang lỗi chung (VD mất kết nối DB)
    page.tsx                # Trang chủ (hero + slogan + 3 tính năng + bài mới)
    login/, register/       # Đăng nhập / đăng ký (?next=/duong-dan để quay lại)
    workouts/page.tsx       # Nhật ký tập (cần đăng nhập)
    meals/page.tsx          # Đo kcal AI (cần đăng nhập)
    admin/                  # Trang quản trị: users/, users/[id]/ (chỉ staff)
    blog/page.tsx, blog/[slug]/page.tsx
    api/auth/[...all]/route.ts  # Toàn bộ endpoint Better Auth
    api/meals/analyze/route.ts  # POST ảnh + ghi chú → JSON dinh dưỡng (cần đăng nhập)
    icon.png, apple-icon.png    # Icon tab / màn hình chính
  components/               # UI dùng chung: site-header (Wordmark), site-footer, nav-links (menu desktop + tab mobile), user-menu, icons, page-heading, post-card
  features/                 # Logic theo tính năng
    auth/                   # auth-form.tsx (đăng nhập/đăng ký/Google)
    admin/                  # users-list, user-detail (server), user-actions (client), actions.ts (Server Actions), badges
    workouts/               # types.ts (zod), repository.ts (MongoDB), actions.ts (Server Actions), workout-log.tsx (server) + workout-log-client.tsx
    meals/                  # schema.ts (zod), analyze-meal.ts (server), meal-analyzer.tsx, meal-result.tsx, resize-image.ts
  lib/
    site.ts                 # Tên, slogan, logo, menu
    permissions.ts          # Role & quyền (dùng chung server + client)
    auth.ts                 # Cấu hình Better Auth (server) — getAuth()
    auth-client.ts          # authClient cho component "use client" (useSession, signIn…)
    session.ts              # getSession / requireUser / requirePermission (server)
    db.ts                   # MongoClient dùng chung — getDb() (server)
    anthropic.ts, blog.ts   # (server)
```

Menu (desktop + tab dưới trên mobile) lấy từ `siteConfig.nav`; thêm trang mới thì thêm vào đó và thêm icon trong `components/icons.tsx`.

Quy ước: code của một tính năng nằm trong `src/features/<tên>/`; file trong `app/` chỉ import và render.

## Các tính năng

### 0. Xác thực & phân quyền
- **Better Auth** lưu user/session/account trong MongoDB (collection `user`, `session`, `account`, `verification` — tự tạo, không cần migrate). Phiên đăng nhập = cookie chứa mã phiên, dữ liệu phiên nằm trong DB.
- Công khai: trang chủ, blog, đăng nhập/đăng ký. **Cần đăng nhập**: `/workouts`, `/meals`, `POST /api/meals/analyze`. **Chỉ staff**: `/admin/*`.
- Role (định nghĩa ở `lib/permissions.ts`):

  | Role | Nhãn | Quyền |
  | --- | --- | --- |
  | `user` | Người dùng | Dùng các tính năng của mình |
  | `cs` | Chăm sóc khách hàng | Xem danh sách/chi tiết user, khoá/mở khoá **user thường**, xem nhật ký tập (chỉ đọc) |
  | `admin` | Quản trị viên | Toàn quyền, gồm đổi role và thao tác với tài khoản staff |

- Hai lớp kiểm tra: (1) **quyền theo role** — Better Auth tự kiểm tra ở mọi endpoint `/admin/*`; (2) **ai được thao tác lên ai** — `canManageUser()`, áp dụng qua hook `before` trong `lib/auth.ts`: không ai tự thao tác với tài khoản của mình, chỉ admin được thao tác với tài khoản staff. Hook chạy cho cả request HTTP lẫn `auth.api.*`.
- **Kiểm tra quyền ở mọi page, Server Action, Route Handler** (`requireUser`, `requirePermission`, `getSession` trong `lib/session.ts`), không chỉ ở layout — layout không chạy lại khi chuyển trang phía client. Server Action là endpoint POST công khai.
- Thêm role: thêm vào `roles` + `ROLE_LABELS`. Thêm quyền: thêm action vào `statement`, cấp cho role, kiểm tra bằng `hasPermission()`. Role lưu dạng chuỗi (nhiều role cách nhau bằng dấu phẩy).
- Admin đầu tiên: đăng ký trên web rồi chạy `npm run set-role -- email@... admin`.
- Khoá tài khoản (ban) sẽ xoá mọi phiên đăng nhập và chặn đăng nhập lại (thông báo tiếng Việt ở `bannedUserMessage`).
- Menu tài khoản trên header (`user-menu.tsx`) chạy ở client (`authClient.useSession()`) để trang chủ/blog vẫn build tĩnh. Đừng đọc session trong root layout — sẽ biến mọi trang thành động.
- Trong `getSession()` phải `await headers()` **trước** khi gọi `getAuth()`, nếu không `next build` sẽ cố kết nối DB khi prerender.
- Better Auth có sẵn rate limit cho đăng nhập/đăng ký (~3 lần/10 giây/IP).

### 1. Nhật ký tập (`/workouts`)
- Mỗi bản ghi = 1 bài tập: ngày, tên bài, nhóm cơ, hiệp × lần × kg, ghi chú. Khối lượng = sets × reps × kg.
- Lưu ở MongoDB, collection `workouts` (`userId`, `date` YYYY-MM-DD, …, `createdAt`), index `{ userId, date, createdAt }`. Mọi truy vấn trong `repository.ts` đều **lọc theo `userId`** của người đang đăng nhập.
- Luồng: `workout-log.tsx` (Server Component) đọc DB → `WorkoutLogClient` hiển thị. Thêm/xoá gọi Server Actions trong `actions.ts` (kiểm tra session + zod) → `refresh()` để tải lại dữ liệu; UI cập nhật tức thì nhờ `useOptimistic`.
- **"Hôm nay" chỉ tính ở client** (`useToday()` trong `workout-log-client.tsx`, theo múi giờ người dùng); server không biết múi giờ của người dùng. Không dùng `new Date()` ở server để lấy ngày hiện tại.
- Staff có quyền `workout:view-any` xem nhật ký của user ở `/admin/users/[id]` (component `WorkoutHistoryReadOnly`).

### 2. Đo kcal bằng ảnh (`/meals`)
- Luồng: client resize ảnh (≤1280px, JPEG) → `POST /api/meals/analyze` (FormData `image`, `note`) → `analyzeMealForm()` kiểm tra ảnh (JPG/PNG/WEBP/GIF, ≤4 MB) → gọi Claude vision bằng **structured outputs** (`client.messages.parse` + `zodOutputFormat(MealAnalysisSchema)`), SDK tự validate bằng zod → server cộng tổng dinh dưỡng → trả `MealResult`. Client validate lại bằng `MealResultSchema`.
- `MealAnalysisSchema` trong `schema.ts` là **nguồn duy nhất**: nó vừa là format gửi cho Claude, vừa là type TS. Các `.describe()` là chỉ dẫn cho model, viết tiếng Việt.
- Ô text "mô tả thêm" được coi là **đáng tin hơn ảnh** (khẩu phần, cách nấu, món bị che).
- Prompt ưu tiên món Việt, trả lời tiếng Việt. Sửa prompt tại `features/meals/analyze-meal.ts`.
- Model lấy từ `ANTHROPIC_MODEL` (mặc định `claude-sonnet-5`).
- Lỗi hiển thị cho người dùng: ném `MealAnalysisError(message, status)`; lỗi SDK (rate limit, 5xx) được `mealErrorResponse()` chuyển thành câu tiếng Việt.
- Khi thêm field kết quả: sửa **2 chỗ** — `schema.ts` (zod) và UI `meal-result.tsx`.

### 3. Blog (`/blog`)
- Thêm bài: tạo `content/blog/<slug-khong-dau>.md` với frontmatter:
  ```yaml
  ---
  title: "Tiêu đề"
  description: "Mô tả 1–2 câu (dùng cho SEO)"
  date: 2026-09-27
  tags: [dinh dưỡng]
  draft: false   # true = ẩn
  ---
  ```
- Slug chỉ gồm `a-z0-9-` (bỏ dấu tiếng Việt). Trang bài được build tĩnh (`generateStaticParams`, `dynamicParams = false`).

## Quy tắc bắt buộc

- **Không bao giờ** lộ secret (`ANTHROPIC_API_KEY`, `MONGODB_URI`, `BETTER_AUTH_SECRET`…) ra client: file có `import "server-only"` không được import từ component `"use client"`. Truy cập DB chỉ trong module `server-only`.
- Dữ liệu của user: luôn lọc theo `session.user.id` lấy từ server, **không bao giờ** tin `userId` gửi lên từ client.
- Không commit `.env*` (trừ `.env.example`).
- Mọi dữ liệu từ AI và mọi input của Server Action/Route Handler đều phải qua zod trước khi dùng.
- Kcal/dinh dưỡng luôn kèm câu nhắc "AI ước tính, chỉ tham khảo". Không đưa lời khuyên y khoa; nội dung về giảm cân tránh khuyến khích nhịn ăn cực đoan.
- Ưu tiên Server Components; chỉ thêm `"use client"` khi cần state/sự kiện/API trình duyệt.
- Màu chỉ dùng token (xem mục **Thương hiệu**): `bg-brand`, `text-foreground`, `text-muted`, `border-border`, `bg-card`... Không hard-code mã hex trong component; muốn đổi màu thì sửa biến trong `globals.css`.
- Mobile-first: người dùng chủ yếu dùng điện thoại (chụp bữa ăn, ghi bài tập ngay tại phòng gym).
- Trước khi báo hoàn thành: `npm run lint` và `npm run build` phải pass.

## Lộ trình (chưa làm)

- [x] Tài khoản người dùng + MongoDB + phân quyền (user / cs / admin)
- [ ] Gửi email (VD Resend): quên mật khẩu, xác minh email
- [ ] Nhật ký thao tác của staff (audit log: ai khoá ai, đổi role khi nào)
- [ ] Lưu lịch sử bữa ăn, tổng kcal/ngày, mục tiêu kcal & protein
- [ ] Biểu đồ tiến bộ (khối lượng tập theo tuần, cân nặng)
- [ ] AI gợi ý lịch tập / nhận xét buổi tập từ nhật ký
- [ ] Giới hạn số lần đo kcal mỗi user/ngày (đã bắt đăng nhập, nhưng 1 tài khoản vẫn gọi được không giới hạn)
- [ ] Bộ logo mới theo tên thehinhAI: logo đầy đủ, icon vuông (favicon, app icon), bản SVG nền trong suốt
- [ ] SEO: sitemap, OG image, JSON-LD cho bài blog
- [ ] Tên miền theo tên thehinhAI: chưa chọn
