# thehinhAI

> Tập để khoẻ đẹp mỗi ngày

Website thể hình tích hợp AI cho người Việt: nhật ký tập, đo kcal bữa ăn bằng ảnh, blog thể hình.

## Chạy dự án

Yêu cầu: Node.js 20.9 trở lên.

```bash
npm install
cp .env.example .env.local   # rồi điền các biến (xem bên dưới)
npm run dev                  # mở http://localhost:5000
```

### 1. MongoDB Atlas (bắt buộc)

1. Tạo cluster miễn phí (M0) tại [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access**: tạo user + mật khẩu.
3. **Network Access**: thêm IP của bạn (khi deploy lên Vercel thì thêm `0.0.0.0/0`).
4. **Connect → Drivers**: copy chuỗi kết nối vào `MONGODB_URI` và thay `<password>`. Nếu mật khẩu có ký tự đặc biệt thì phải URL-encode.

Không cần tạo bảng: collection được tạo tự động khi dùng.

### 2. Better Auth (bắt buộc)

- `BETTER_AUTH_SECRET`: chuỗi ngẫu nhiên, tạo bằng `npx @better-auth/cli secret`.
- `BETTER_AUTH_URL`: `http://localhost:5000` khi phát triển, tên miền thật khi deploy.

### 3. Đăng nhập Google (không bắt buộc)

Tại Google Cloud Console → APIs & Services → Credentials, tạo **OAuth client ID** (loại Web application):

- Authorized redirect URI: `http://localhost:5000/api/auth/callback/google` (và `https://<tên-miền>/api/auth/callback/google` khi deploy).
- Điền `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`. Bỏ trống thì nút Google sẽ tự ẩn.

### 4. Claude (cho trang Đo kcal)

Điền `ANTHROPIC_API_KEY`.

### 5. Tạo admin đầu tiên

Đăng ký tài khoản trên web, rồi chạy:

```bash
npm run set-role -- email-cua-ban@example.com admin
```

Các role có sẵn: `user`, `cs` (chăm sóc khách hàng), `admin`. Trang quản trị nằm ở `/admin`.

## Lệnh thường dùng

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Chạy môi trường phát triển |
| `npm run build` | Build production |
| `npm run start` | Chạy bản đã build |
| `npm run lint` | Kiểm tra code bằng ESLint |
| `npm run set-role -- <email> <role>` | Cấp role cho người dùng |

## Thêm bài blog

Tạo file `content/blog/<slug-khong-dau>.md`. Frontmatter mẫu có trong [CLAUDE.md](CLAUDE.md).

Quy ước code, cấu trúc thư mục, phân quyền và nhận diện thương hiệu: xem [CLAUDE.md](CLAUDE.md).
