import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    // Extra bottom padding on mobile so the fixed tab bar doesn't cover it
    <footer className="border-t border-border pb-24 pt-6 md:pb-8">
      <div className="mx-auto w-full max-w-3xl space-y-1 px-4 text-sm text-muted">
        <p>
          <span className="font-semibold text-foreground">{siteConfig.name}</span> —{" "}
          {siteConfig.slogan}
        </p>
        <p>
          Thông tin trên website chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ
          hay chuyên gia dinh dưỡng.
        </p>
      </div>
    </footer>
  );
}
