export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
      {subtitle && <p className="text-muted">{subtitle}</p>}
    </header>
  );
}
