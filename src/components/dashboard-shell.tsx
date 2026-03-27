"use client";

import { logoutAction } from "@/app/actions";
import { cx, TinyBadge } from "@/components/portal-ui";
import type { Permission, PortalUser, StudentPayment, UserRole } from "@/lib/portal-data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  hint: string;
};

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  owner: [
    { href: "/dashboard", label: "Overview", hint: "Today at a glance" },
    { href: "/dashboard/classes", label: "Classes", hint: "Courses and live rooms" },
    { href: "/dashboard/schedule", label: "Schedule", hint: "Deadlines and calendar" },
    { href: "/dashboard/finance", label: "Finance", hint: "Income and payments" },
    { href: "/dashboard/people", label: "People", hint: "Users and access" },
    { href: "/dashboard/settings", label: "Settings", hint: "Security and support" },
  ],
  secretary: [
    { href: "/dashboard/finance", label: "Finance", hint: "Bills and expenses" },
    { href: "/dashboard/settings", label: "Settings", hint: "Account and support" },
  ],
  teacher: [
    { href: "/dashboard", label: "Overview", hint: "Today at a glance" },
    { href: "/dashboard/classes", label: "Classes", hint: "Your courses" },
    { href: "/dashboard/schedule", label: "Schedule", hint: "Teaching week" },
    { href: "/dashboard/people", label: "Students", hint: "Class roster" },
    { href: "/dashboard/settings", label: "Settings", hint: "Account and support" },
  ],
  student: [
    { href: "/dashboard", label: "Overview", hint: "Today at a glance" },
    { href: "/dashboard/classes", label: "Classes", hint: "Live rooms and work" },
    { href: "/dashboard/schedule", label: "Schedule", hint: "Deadlines and planner" },
    { href: "/dashboard/finance", label: "Billing", hint: "Payment status" },
    { href: "/dashboard/settings", label: "Settings", hint: "Account and support" },
  ],
};

export function DashboardShell({
  viewer,
  permissions,
  payment,
  roleLabel,
  children,
}: {
  viewer: PortalUser;
  permissions: Permission[];
  payment: StudentPayment | null;
  roleLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[viewer.role];
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl gap-6 xl:grid-cols-[290px_1fr]">
        <aside className="hidden h-[calc(100vh-2rem)] flex-col rounded-[34px] border border-border bg-panel p-5 shadow-[var(--shadow)] xl:flex">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Campus Hub
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Smart College App
              </h1>
            </div>
            <TinyBadge tone="brand">{roleLabel}</TinyBadge>
          </div>

          <div className="mt-6 rounded-[26px] border border-border bg-white/[0.76] p-4">
            <p className="text-sm font-semibold text-foreground">{viewer.name}</p>
            <p className="mt-1 text-sm leading-7 text-muted">{viewer.email}</p>
            <p className="mt-3 text-sm leading-7 text-ink-soft">{viewer.title}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <TinyBadge>{permissions.length} permissions</TinyBadge>
              <TinyBadge tone="accent">
                {viewer.role === "student"
                ? payment?.status === "paid"
                  ? "Payment clear"
                  : "Payment due"
                : viewer.role === "secretary"
                  ? "Finance access"
                  : "Access granted"}
              </TinyBadge>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "block rounded-[22px] border px-4 py-3 transition",
                    active
                      ? "border-brand bg-brand/[0.08]"
                      : "border-transparent bg-white/[0.54] hover:border-border hover:bg-white/[0.72]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-xs leading-6 text-muted">
                        {item.hint}
                      </p>
                    </div>
                    {active ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-[26px] border border-border bg-[#13263b] p-4 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">
              Working mode
            </p>
            <p className="mt-2 text-lg font-semibold">Live campus portal</p>
            <p className="mt-2 text-sm leading-7 text-white/76">
              Dashboard, classes, schedule, finance, and access controls live in one
              app shell.
            </p>
          </div>

          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              Sign out
            </button>
          </form>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <header className="rounded-[34px] border border-border bg-panel p-5 shadow-[var(--shadow)] xl:hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  Campus Hub
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  Smart College App
                </h1>
                <p className="mt-2 text-sm leading-7 text-muted">{viewer.name}</p>
              </div>
              <TinyBadge tone="brand">{roleLabel}</TinyBadge>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-brand text-white"
                        : "bg-white/[0.78] text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </header>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
