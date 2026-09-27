export const siteConfig = {
  name: "thehinhAI",
  slogan: "Tập để khoẻ đẹp mỗi ngày",
  description:
    "Website thể hình tích hợp AI cho người Việt: nhật ký tập, đo kcal bữa ăn bằng ảnh, blog thể hình.",
  // Logo mark only (figure + AI chip), transparent, one file per theme.
  // The name is rendered as text by <Wordmark />.
  logo: {
    dark: "/brand/logo-mark-dark.png", // white figure
    light: "/brand/logo-mark-light.png", // black figure
    width: 770,
    height: 540,
  },
  // Browser UI color per OS theme; matches --background (metadata can't read CSS variables)
  themeColor: { dark: "#000000", light: "#FFFFFF" },
  nav: [
    { href: "/", label: "Trang chủ", icon: "home" },
    { href: "/workouts", label: "Nhật ký tập", icon: "dumbbell" },
    { href: "/meals", label: "Đo kcal AI", icon: "camera" },
    { href: "/blog", label: "Blog", icon: "book" },
  ],
} as const;

export type NavIcon = (typeof siteConfig.nav)[number]["icon"];
