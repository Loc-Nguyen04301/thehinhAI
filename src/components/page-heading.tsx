export function PageHeading({
  title,
  subtitle,
  as: Heading = "h1",
}: {
  title: string;
  subtitle?: string;
  /** "h2" for a second section on the same page (one <h1> per page). */
  as?: "h1" | "h2";
}) {
  return (
    <header className="space-y-1">
      <Heading className="text-2xl font-extrabold md:text-3xl">{title}</Heading>
      {subtitle && <p className="text-muted">{subtitle}</p>}
    </header>
  );
}
