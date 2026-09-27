export const siteConfig = {
  name: "thehinhAI",
  slogan: "Tập để khoẻ đẹp mỗi ngày",
  description:
    "Website thể hình tích hợp AI cho người Việt: nhật ký tập, đo kcal bữa ăn bằng ảnh, blog thể hình.",
  // Logo mark only (figure + AI chip). The name is rendered as text by <Wordmark />.
  logo: { src: "/brand/logo-mark.png", width: 770, height: 540 },
  // Matches --background in globals.css (metadata can't read CSS variables)
  themeColor: "#000000",
  nav: [
    { href: "/", label: "Trang chủ", icon: "home" },
    { href: "/workouts", label: "Nhật ký tập", icon: "dumbbell" },
    { href: "/meals", label: "Đo kcal AI", icon: "camera" },
    { href: "/blog", label: "Blog", icon: "book" },
  ],
} as const;

export type NavIcon = (typeof siteConfig.nav)[number]["icon"];
