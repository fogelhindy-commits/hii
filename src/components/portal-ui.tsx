import type { ReactNode } from "react";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[30px] border border-border bg-panel p-6 shadow-[var(--shadow)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
        {eyebrow}
      </p>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[26px] border border-border bg-white/[0.78] p-5">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-3 text-sm leading-7 text-muted">{detail}</p>
    </div>
  );
}

export function TinyBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "accent";
}) {
  const toneClass =
    tone === "brand"
      ? "bg-brand-soft text-brand"
      : tone === "accent"
        ? "bg-accent-soft text-accent"
        : "bg-[#f7f2e8] text-foreground";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}
