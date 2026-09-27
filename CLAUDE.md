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
- **Wordmark (tên dạng chữ):** `thehinh` màu chữ chính (`foreground`) + `AI` màu `brand`, chữ đậm nghiêng — component `Wordmark` trong `site-header.tsx` (header và hero đều dùng).
- **Logo biểu tượng** (`siteConfig.logo`): hình người tập tạ + chip "AI", 770×540, nền trong suốt, **không có chữ**. Có 2 bản theo giao diện: `public/brand/logo-mark-dark.png` (hình người trắng) và `logo-mark-light.png` (hình người đen); phần xanh giữ nguyên. Hero = logo biểu tượng + `Wordmark`, hai ảnh được ẩn/hiện bằng `dark:hidden` / `hidden dark:block`.
  - Luôn hiển thị bằng `next/image`; không kéo méo, đổi màu hay thêm hiệu ứng.
  - Icon tab/điện thoại: `src/app/icon.png` (512px) và `apple-icon.png` (180px), nền đen, cắt từ cùng phần biểu tượng.
- `public/brand/logo.png` là **logo cũ** (nền đen, còn chữ `thehinhdaily-ai` và tagline) — chỉ giữ làm file gốc để cắt biểu tượng, **không hiển thị trên web**. Chờ bộ logo mới (xem Lộ trình).

### Giao diện sáng / tối

- Có 2 giao diện: **tối** (nền đen, chữ trắng) và **sáng** (nền trắng, chữ đen). Nút chuyển (`components/theme-toggle.tsx`, icon mặt trời/mặt trăng) nằm trên header.
- Lựa chọn lưu trong `localStorage` (key `thehinhai.theme`, xem `lib/theme.ts`). Chưa chọn → theo cài đặt sáng/tối của hệ điều hành.
- Giao diện được gắn vào `<html data-theme="dark|light">` bởi **script inline trong `<head>`** (`themeInitScript`, chạy trước khi vẽ trang → không bị nháy). Vì vậy `<html>` có `suppressHydrationWarning`. Đừng chuyển script này sang `useEffect` hay `next/script`.
- Muốn style khác nhau theo giao diện: ưu tiên dùng token (tự đổi theo giao diện); khi thật cần thì dùng biến thể `dark:` — đã cấu hình theo `data-theme` (không theo hệ điều hành) bằng `@custom-variant dark` trong `globals.css`.
- UI phải hiển thị đúng khi server chưa biết giao diện: chọn icon/ảnh bằng CSS (`dark:`), **không** đọc theme bằng JS lúc render.

### Bảng màu

Khai báo trong `src/app/globals.css`: `:root` = giao diện tối, `:root[data-theme="light"]` = giao diện sáng. Tailwind v4 tự sinh class `bg-brand`, `text-muted`, `from-brand-light`…

| Token | Tối | Sáng | Dùng cho |
| --- | --- | --- | --- |
| `--brand` | `#05A8FA` | `#0470F0` | Màu chính: nút CTA, link, icon đang chọn, số liệu nổi bật |
| `--brand-light` | `#08CAFA` | `#05A8FA` | Đầu sáng của gradient, điểm nhấn trang trí (không dùng cho chữ nhỏ) |
| `--brand-dark` | `#0470F0` | `#0470F0` | Trạng thái nhấn (active), đầu đậm của gradient |
| `--brand-hover` | `#08CAFA` | `#0459C7` | Hover của nút/link (`hover:bg-brand-hover`, `hover:text-brand-hover`) |
| `--background` | `#000000` | `#FFFFFF` | Nền trang |
| `--foreground` | `#FFFFFF` | `#0A0A0A` | Chữ chính |
| `--card` | `#0E0E10` | `#F4F4F5` | Nền thẻ/khối |
| `--border` | `#27272A` | `#E4E4E7` | Viền |
| `--muted` | `#A1A1AA` | `#52525B` | Chữ phụ |
| `--danger` | `#F87171` | `#DC2626` | Chỉ cho thông báo lỗi |

- Bảng màu thương hiệu gốc: `#05A8FA`, `#08CAFA`, `#0470F0`. Ngoại lệ duy nhất là `#0459C7` (sắc đậm hơn của `#0470F0`), chỉ dùng cho hover ở giao diện sáng. Không thêm màu mới ngoài các token trên.
- **Vì sao giao diện sáng dùng `#0470F0`:** `#05A8FA` trên nền trắng chỉ đạt tương phản ~2.6:1, khó đọc; `#0470F0` đạt ~4.6:1 (chuẩn AA), cả khi làm chữ trên nền trắng lẫn làm nền cho chữ trắng.
- **Chữ trên nền `bg-brand` luôn dùng `text-background`**: giao diện tối cho chữ đen trên `#05A8FA` (~8:1), giao diện sáng cho chữ trắng trên `#0470F0` (~4.6:1). Không dùng `text-white`/`text-black`.
- Gradient thương hiệu (vòng cung trong logo): `bg-linear-to-r from-brand-light to-brand-dark`.

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
public/brand/logo-mark-{dark,light}.png  # Logo biểu tượng (không chữ) theo giao diện — logo.png là logo cũ, không dùng
scripts/set-role.mts        # CLI cấp role (npm run set-role)
src/
  app/                      # Chỉ routing: page/layout/route mỏng, gọi sang features/
    layout.tsx              # Font, metadata, header + footer + thanh tab dưới (mobile)
    error.tsx               # Trang lỗi chung (VD mất kết nối DB)
    page.tsx                # Trang chủ (hero + slogan + 4 tính năng + bài mới)
    login/, register/       # Đăng nhập / đăng ký (?next=/duong-dan để quay lại)
    workouts/page.tsx       # Nhật ký tập (cần đăng nhập)
    meal-logs/page.tsx      # Nhật ký ăn — tự nhập kcal, không AI (cần đăng nhập)
    meals/page.tsx          # Đo kcal AI (cần đăng nhập)
    admin/                  # Trang quản trị: users/, users/[id]/ (chỉ staff)
    blog/page.tsx, blog/[slug]/page.tsx
    api/auth/[...all]/route.ts  # Toàn bộ endpoint Better Auth
    api/meals/analyze/route.ts  # POST ảnh + ghi chú → JSON dinh dưỡng (cần đăng nhập)
    icon.png, apple-icon.png    # Icon tab / màn hình chính
  components/               # UI dùng chung: site-header (Wordmark; 3 vùng: chữ logo trái – menu giữa – nút sáng/tối + tài khoản phải), site-footer, nav-links (menu desktop + tab mobile), user-menu, theme-toggle, icons, page-heading, post-card, date-range-filter (bộ chọn "Từ ngày – Đến ngày" cho lịch sử các nhật ký)
  features/                 # Logic theo tính năng
    auth/                   # auth-form.tsx (đăng nhập/đăng ký/Google)
    admin/                  # users-list, user-detail (server), user-actions (client), actions.ts (Server Actions), badges
    workouts/               # types.ts (zod), repository.ts (MongoDB), actions.ts (Server Actions), workout-log.tsx (server) + workout-log-client.tsx
    meals/                  # schema.ts (zod), analyze-meal.ts (server), meal-analyzer.tsx, meal-result.tsx, resize-image.ts, drop-image.ts (đọc ảnh kéo thả)
    meal-logs/              # Nhật ký ăn (không AI): types.ts (zod), repository.ts (MongoDB), actions.ts (Server Actions), meal-log.tsx (server) + meal-log-client.tsx
  lib/
    site.ts                 # Tên, slogan, logo, menu
    theme.ts                # Giao diện sáng/tối: key localStorage, script chống nháy, setTheme()
    date.ts                 # useToday(), formatDay() ("Hôm nay"/"Hôm qua"…), formatShortDay(), addDays(), groupByDate(), numberFormat — dùng chung cho các nhật ký (chỉ import từ client)
    date-range.ts           # Lọc lịch sử theo khoảng ngày: DateRangeSchema, parseDateRange(), loadRecentAndRange() (server + client)
    permissions.ts          # Role & quyền (dùng chung server + client)
    auth.ts                 # Cấu hình Better Auth (server) — getAuth()
    auth-client.ts          # authClient cho component "use client" (useSession, signIn…)
    session.ts              # getSession / requireUser / requirePermission (server)
    db.ts                   # MongoClient dùng chung — getDb() (server)
    anthropic.ts, blog.ts   # (server)
```

Menu (desktop + tab dưới trên mobile) lấy từ `siteConfig.nav`; thêm trang mới thì thêm vào đó và thêm icon trong `components/icons.tsx`. Thanh tab dưới tự chia đều cột theo số mục (`grid-flow-col auto-cols-fr`), không cần sửa số cột.

Quy ước: code của một tính năng nằm trong `src/features/<tên>/`; file trong `app/` chỉ import và render.

## Cơ sở dữ liệu (MongoDB)

Database `thehinh-ai` trên Atlas (tên lấy từ `MONGODB_DB`). **Không có file schema riêng / không dùng Mongoose**: hình dạng document được quy định trong code và dữ liệu được kiểm tra bằng zod trước khi ghi. Collection tự được tạo khi dùng lần đầu, không cần migrate.

**Quy ước id (quan trọng khi truy vấn):**
- Mọi `_id` và mọi khoá tham chiếu (`userId`) là **`ObjectId`**, không phải chuỗi — nhờ vậy `$lookup` / lọc giữa các collection chạy trực tiếp.
- Ở tầng ứng dụng, id là **chuỗi hex 24 ký tự** (`session.user.id`, id gửi lên từ client). Chuyển sang ObjectId bằng `toObjectId()` trong `lib/db.ts` (trả `null` nếu sai định dạng), chỉ ngay tại chỗ truy vấn trong repository.
- Collection mới có trường trỏ tới user thì đặt tên `userId`, kiểu `ObjectId`.

**Collection do Better Auth quản lý** — thư viện tự định nghĩa trường; chỉ cấu hình qua `lib/auth.ts`, **không sửa tay trên Atlas** (đổi role dùng `/admin` hoặc `npm run set-role`):

| Collection | Trường chính |
| --- | --- |
| `user` | `_id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`; plugin admin thêm `role`, `banned`, `banReason`, `banExpires` |
| `account` | `userId` → `user._id`, `providerId` (`credential` = email + mật khẩu, `google`), `accountId`, `password` (đã băm), `accessToken`, `refreshToken`, `idToken`, `scope`… |
| `session` | `userId` → `user._id`, `token`, `expiresAt`, `ipAddress`, `userAgent`, `impersonatedBy` |
| `verification` | `identifier`, `value`, `expiresAt` (chỉ xuất hiện khi cần, VD đăng nhập Google) |

**Collection của ứng dụng:**

| Collection | Trường | Index | Định nghĩa |
| --- | --- | --- | --- |
| `workouts` | `_id`, `userId` (ObjectId → `user._id`), `date` (chuỗi `YYYY-MM-DD`, ngày theo giờ người dùng), `exercise`, `muscleGroup`, `sets` (mảng 1–`MAX_SETS` (= 20) phần tử `{ reps, weightKg }`, mỗi hiệp một phần tử, `weightKg: 0` = tự trọng), `note?`, `createdAt` (Date), `updatedAt?` (Date, có khi đã sửa) | `{ userId: 1, date: -1, createdAt: -1 }` | Kiểu `WorkoutDoc` trong `features/workouts/repository.ts`; ràng buộc giá trị: `WorkoutInputSchema` (zod) trong `types.ts` |
| `mealLogs` | `_id`, `userId` (ObjectId → `user._id`), `date` (chuỗi `YYYY-MM-DD`, ngày theo giờ người dùng), `name` (tên món), `grams` (số nguyên 1–5000), `kcal` (số nguyên 0–5000, người dùng tự nhập), `note?` (≤ 200 ký tự), `createdAt` (Date), `updatedAt?` (Date, có khi đã sửa) | `{ userId: 1, date: -1, createdAt: -1 }` | Kiểu `MealLogDoc` trong `features/meal-logs/repository.ts`; ràng buộc giá trị: `MealLogInputSchema` (zod) trong `types.ts` |

- Thêm collection mới: khai báo kiểu document + hàm truy vấn trong `features/<tên>/repository.ts` (`import "server-only"`), schema zod cho input trong `types.ts`, tạo index ngay trong repository (xem `workouts()`), rồi bổ sung bảng trên.
- Ví dụ truy vấn trên Atlas (Aggregations): tổng số hiệp và khối lượng tập theo user — `$unwind` mảng `sets` để tính trên từng hiệp
  ```js
  [
    { $unwind: "$sets" },
    { $group: { _id: "$userId", sets: { $sum: 1 }, volume: { $sum: { $multiply: ["$sets.reps", "$sets.weightKg"] } } } },
    { $lookup: { from: "user", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: { _id: 0, email: "$user.email", sets: 1, volume: 1 } },
  ]
  ```
- **Lịch sử đổi cấu trúc** (đã chạy trên Atlas): `userId` chuỗi → ObjectId; `sets/reps/weightKg` (số) → mảng `sets: [{ reps, weightKg }]`. Đổi cấu trúc lần sau: viết lệnh `updateMany` chuyển dữ liệu cũ, chạy **ngay sau** khi đổi code (code mới không đọc được dữ liệu dạng cũ), rồi ghi thêm vào đây.

## Các tính năng

### 0. Xác thực & phân quyền
- **Better Auth** lưu user/session/account trong MongoDB (collection `user`, `session`, `account`, `verification` — tự tạo, không cần migrate). Phiên đăng nhập = cookie chứa mã phiên, dữ liệu phiên nằm trong DB.
- Công khai: trang chủ, blog, đăng nhập/đăng ký. **Cần đăng nhập**: `/workouts`, `/meal-logs`, `/meals`, `POST /api/meals/analyze`. **Chỉ staff**: `/admin/*`.
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

### Lọc lịch sử theo khoảng ngày (dùng chung: Nhật ký tập + Nhật ký ăn)
- Lịch sử **không hiện hết**: mặc định **7 ngày gần nhất** (`DEFAULT_RANGE_DAYS`); người dùng chọn "Từ ngày – Đến ngày" + nút Xem để xem khoảng khác. Thẻ bộ lọc hiện số tổng của khoảng (mỗi tính năng tự truyền vào qua `children`), danh sách chỉ hiện các ngày trong khoảng.
- Khoảng nằm trên URL `?from=YYYY-MM-DD&to=YYYY-MM-DD` (lưu/chia sẻ được, nút Back quay lại khoảng trước). Đổi khoảng bằng `router.push(..., { scroll: false })` trong `useTransition` → nút hiện "Đang tải…", danh sách mờ đi tới khi có dữ liệu mới.
- Code dùng chung:
  - `lib/date-range.ts` (server + client): `DateRangeSchema` (from ≤ to, tối đa `MAX_RANGE_DAYS` = 366 ngày), `parseDateRange(searchParams)` (sai → `null` = mặc định), `loadRecentAndRange(list, range)`.
  - `components/date-range-filter.tsx` (client): `DateRangeFilter` (thẻ + form), `useRangeNavigation()`, `shownRange()`, `rangeLabel()`, `isInRange()`, `TruncatedRangeNote`.
- Server component (`workout-log.tsx`, `meal-log.tsx`) gọi `loadRecentAndRange`: tải **các mục trong khoảng** (tối đa `MAX_RANGE_ENTRIES` = 3000, vượt thì hiện `TruncatedRangeNote`) **gộp với các mục gần nhất** (cần cho mặc định 7 ngày, "hôm nay" và gợi ý tên). Hàm `list*` trong repository nhận `{ range?, limit? }`.
- Mặc định 7 ngày được tính ở client (server không biết "hôm nay" của người dùng) và lọc trên các mục gần nhất (200 bài tập / 300 món ăn).
- Nhật ký mới cần lọc theo ngày: dùng lại đúng bộ này, đừng viết lại.

### 1. Nhật ký tập (`/workouts`)
- Mỗi bản ghi = 1 bài tập: ngày, tên bài, nhóm cơ, **danh sách hiệp** (mỗi hiệp có số lần và mức tạ riêng), ghi chú. Khối lượng = Σ (số lần × kg) của các hiệp (`volumeOf()`).
- Form nhập hiệp (`SetsEditor`): mỗi hiệp một dòng; "+ Thêm hiệp" chép số lần + mức tạ của hiệp trước; nút × xoá hiệp (luôn giữ ít nhất 1). Lỗi của một hiệp hiện kèm số hiệp ("Hiệp 2: …", `firstIssueMessage()`). Sau khi lưu, form giữ số hiệp + số lần, xoá mức tạ.
- Hiển thị trong lịch sử (`WorkoutItem`): **mỗi hiệp một dòng** ("Hiệp 1   10 lần × 60 kg"); các hiệp liên tiếp giống nhau gộp thành một dòng có khoảng ("Hiệp 1–3   12 lần × 40 kg", `groupSets()`); **"Tổng khối lượng: … kg" ở dòng riêng** (ẩn khi toàn tự trọng). Không gộp các hiệp và tổng vào chung một dòng.
- Lưu ở collection `workouts` (xem mục **Cơ sở dữ liệu**). Mọi truy vấn trong `repository.ts` đều **lọc theo `userId`** của người đang đăng nhập.
- Luồng: `workout-log.tsx` (Server Component) đọc DB → `WorkoutLogClient` hiển thị. Thêm / sửa / xoá gọi Server Actions `addWorkoutAction` / `updateWorkoutAction` / `removeWorkoutAction` trong `actions.ts` (kiểm tra session + zod) → `refresh()` để tải lại dữ liệu; UI cập nhật tức thì nhờ `useOptimistic` (bài chưa được server xác nhận có `pending: true`, hiện mờ và không bấm được).
- **Sửa bài tập:** chạm vào một bài trong "Lịch sử tập" → mở **popup** "Sửa bài tập" (`EditWorkoutDialog`, thẻ `<dialog>` gốc + `showModal()`), điền sẵn dữ liệu cũ. Không sửa tại chỗ trong danh sách — dễ nhầm với form "Ghi bài tập". Đóng bằng ×, Huỷ, Esc hoặc bấm ra ngoài; nền phía sau bị khoá (không bấm/cuộn được, CSS `html:has(dialog[open])` trong `globals.css`), đóng xong focus quay về bài vừa chạm.
- Form tạo mới và form sửa dùng chung component `WorkoutForm` (có `initial` = chế độ sửa). Xoá ghi chú khi sửa sẽ `$unset` trường `note`.
- Popup/hộp thoại mới trong dự án: dùng `<dialog>` + `showModal()` như `EditWorkoutDialog`, không tự dựng lớp phủ bằng `div`.
- **"Hôm nay" chỉ tính ở client** (`useToday()` trong `lib/date.ts`, theo múi giờ người dùng); server không biết múi giờ của người dùng. Không dùng `new Date()` ở server để lấy ngày hiện tại.
- **"Lịch sử tập" lọc theo khoảng ngày** (xem mục chung ở trên, `WorkoutLogHistory`): thẻ tổng hiện **tổng khối lượng (kg)** của khoảng, số bài · số hiệp, số ngày tập. Danh sách theo ngày là `WorkoutDays` (dùng chung với bản chỉ đọc).
- Staff có quyền `workout:view-any` xem nhật ký của user ở `/admin/users/[id]` (component `WorkoutHistoryReadOnly`: 50 bài gần nhất, không có bộ lọc).

### 2. Đo kcal bằng ảnh (`/meals`)
- Chọn ảnh (`meal-analyzer.tsx`): bấm để chụp/chọn ảnh, hoặc **kéo thả** vào khung (máy tính). Khi kéo qua: khung viền xanh + "Thả ảnh vào đây" (đã có ảnh thì "Thả để đổi ảnh"). Có listener `dragover`/`drop` trên `window` để file/link thả trượt ra ngoài khung không làm trình duyệt mở nó và rời trang (trừ khi thả vào ô nhập chữ).
- **Kéo từ trang web / tab khác** (VD Google Images): trình duyệt **không gửi file**, chỉ gửi `text/html` (`<img src>`) + `text/uri-list` (đã kiểm chứng bằng kéo thả thật trên Edge). `drop-image.ts` xử lý theo thứ tự: file ảnh → `<img src>` trong HTML → link. Ảnh `data:` (thumbnail Google) được chuyển thành file như ảnh thường; ảnh `http(s)` giữ nguyên **URL** (trang không đọc được ảnh domain khác vì CORS) → gửi `imageUrl` lên server → Claude tự tải (`source: { type: "url" }`). Server **không bao giờ tự tải URL người dùng gửi** (tránh SSRF). Ảnh xem trước không tải được hoặc Claude không tải được → báo "Không tải được ảnh từ trang web này…".
- Luồng: client resize ảnh (≤1280px, JPEG) → `POST /api/meals/analyze` (FormData `image` **hoặc** `imageUrl`, và `note`) → `analyzeMealForm()` kiểm tra ảnh (JPG/PNG/WEBP/GIF, ≤4 MB; URL phải là http(s), ≤2048 ký tự) → gọi Claude vision bằng **structured outputs** (`client.messages.parse` + `zodOutputFormat(MealAnalysisSchema)`), SDK tự validate bằng zod → server cộng tổng dinh dưỡng → trả `MealResult`. Client validate lại bằng `MealResultSchema`.
- `MealAnalysisSchema` trong `schema.ts` là **nguồn duy nhất**: nó vừa là format gửi cho Claude, vừa là type TS. Các `.describe()` là chỉ dẫn cho model, viết tiếng Việt.
- Ô text "mô tả thêm" được coi là **đáng tin hơn ảnh** (khẩu phần, cách nấu, món bị che).
- Prompt ưu tiên món Việt, trả lời tiếng Việt. Sửa prompt tại `features/meals/analyze-meal.ts`.
- Model lấy từ `ANTHROPIC_MODEL` (mặc định `claude-sonnet-5`).
- Lỗi hiển thị cho người dùng: ném `MealAnalysisError(message, status)`; lỗi SDK (rate limit, 5xx) được `mealErrorResponse()` chuyển thành câu tiếng Việt.
- Khi thêm field kết quả: sửa **2 chỗ** — `schema.ts` (zod) và UI `meal-result.tsx`.

### 3. Nhật ký ăn (`/meal-logs`)
- Trang và mục menu **riêng**, tách khỏi "Đo kcal AI" (`/meals`) — đừng gộp lại vào chung một trang.
- **Không dùng AI**: người dùng tự nhập mỗi món = ngày, tên món, khối lượng (g), kcal, ghi chú (không bắt buộc; xoá ghi chú khi sửa sẽ `$unset` trường `note`). Hệ thống chỉ cộng **tổng kcal theo ngày** (`totalKcal()` trong `types.ts`). Vì số liệu do người dùng tự nhập nên **không** kèm câu "AI ước tính".
- Cùng khuôn với Nhật ký tập: `meal-log.tsx` (Server Component) đọc DB → `MealLogClient`; Server Actions `addMealLogAction` / `updateMealLogAction` / `removeMealLogAction` (kiểm tra session + zod) → `refresh()`; `useOptimistic` cho cập nhật tức thì; sửa bằng popup `EditMealLogDialog` (`<dialog>`); mọi truy vấn lọc theo `userId`.
- Giao diện: thẻ "Tổng kcal hôm nay" trên cùng → form "Ghi món ăn" (lưu xong giữ ngày, xoá các ô còn lại) → "Lịch sử ăn uống" nhóm theo ngày, mỗi ngày ghi "N món · Tổng X kcal". Ô tên món gợi ý các món đã ghi trước đó (`<datalist>`).
- **"Lịch sử ăn uống" lọc theo khoảng ngày** (xem mục chung ở trên, `MealLogHistory`): thẻ tổng hiện **tổng kcal của khoảng**, số món, số ngày có ghi.
- Lưu ở collection `mealLogs` (xem mục **Cơ sở dữ liệu**).

### 4. Blog (`/blog`)
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
- [x] Nhật ký ăn thủ công + tổng kcal/ngày (không AI)
- [ ] Mục tiêu kcal & protein mỗi ngày
- [ ] Biểu đồ tiến bộ (khối lượng tập theo tuần, cân nặng)
- [ ] AI gợi ý lịch tập / nhận xét buổi tập từ nhật ký
- [ ] Giới hạn số lần đo kcal mỗi user/ngày (đã bắt đăng nhập, nhưng 1 tài khoản vẫn gọi được không giới hạn)
- [ ] Bộ logo mới theo tên thehinhAI: logo đầy đủ, icon vuông (favicon, app icon), bản SVG nền trong suốt
- [ ] SEO: sitemap, OG image, JSON-LD cho bài blog
- [ ] Tên miền theo tên thehinhAI: chưa chọn
