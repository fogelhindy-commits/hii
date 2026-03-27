import { requireDashboardViewer } from "@/lib/auth";
import {
  getOwnerPortalView,
  getStudentPortalView,
  getTeacherPortalView,
} from "@/lib/portal-view";
import { MetricCard, Panel, SectionHeading, TinyBadge } from "@/components/portal-ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

function Hero({
  name,
  roleLabel,
  permissions,
}: {
  name: string;
  roleLabel: string;
  permissions: string[];
}) {
  return (
    <Panel>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-3">
            <TinyBadge tone="brand">Smart College App</TinyBadge>
            <TinyBadge>{roleLabel}</TinyBadge>
            <TinyBadge tone="accent">{permissions.length} permissions</TinyBadge>
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Welcome back, {name.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-ink-soft sm:text-lg">
            This is your live workspace for classes, schedule, finance, and
            access control.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/classes"
            className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
          >
            Open classes
          </Link>
          <Link
            href="/dashboard/schedule"
            className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
          >
            View schedule
          </Link>
        </div>
      </div>
    </Panel>
  );
}

function QuickActionCard({
  title,
  detail,
  href,
}: {
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[26px] border border-border bg-white/[0.78] p-5 transition hover:-translate-y-0.5 hover:border-brand"
    >
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-3 text-sm leading-7 text-muted">{detail}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const viewer = await requireDashboardViewer();

  if (viewer.user.role === "secretary") {
    const view = await getOwnerPortalView({
      user: viewer.user,
      permissions: viewer.permissions,
    });

    return (
      <div className="flex flex-col gap-6">
        <Hero
          name={view.viewer.name}
          roleLabel="Secretary"
          permissions={viewer.permissions}
        />

        <section className="grid gap-4 lg:grid-cols-4">
          {view.stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>

        <Panel>
          <SectionHeading
            eyebrow="Finance desk"
            title="QuickBooks workspace"
            description="Secretaries can open finance, add bills, add expenses, and manage the billing queue."
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <QuickActionCard
              href="/dashboard/finance"
              title="Open finance"
              detail="Manage bills, invoices, expenses, and payment records."
            />
            <QuickActionCard
              href="/dashboard/settings"
              title="Open settings"
              detail="Review account access and support tools."
            />
          </div>
        </Panel>
      </div>
    );
  }

  if (viewer.user.role === "student") {
    const view = await getStudentPortalView({
      user: viewer.user,
      permissions: viewer.permissions,
      payment: viewer.payment!,
    });

    return (
      <div className="flex flex-col gap-6">
        <Hero
          name={view.viewer.name}
          roleLabel={view.roleLabel}
          permissions={view.permissions}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {view.stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel>
            <SectionHeading
              eyebrow="Today"
              title="Your classes and assignments"
              description="Students see only the classes they are enrolled in and the work that belongs to them."
            />

            <div className="mt-6 space-y-4">
              {view.classes.slice(0, 3).map((campusClass) => (
                <div
                  key={campusClass.id}
                  className="rounded-[26px] border border-border bg-white/[0.8] p-4"
                >
                  <p className="font-semibold text-foreground">{campusClass.name}</p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {campusClass.schedule} | {campusClass.room}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-ink-soft">
                    {campusClass.zoomMessage}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeading
              eyebrow="Next steps"
              title="What to do next"
              description="The payment gate keeps unpaid students out until their account is cleared."
            />
            <div className="mt-6 space-y-3">
              <QuickActionCard
                href="/dashboard/schedule"
                title="Open schedule"
                detail="Review deadlines, study blocks, and class times."
              />
              <QuickActionCard
                href="/dashboard/classes"
                title="Open classes"
                detail="Jump into live rooms, recordings, and assignments."
              />
            </div>
          </Panel>
        </section>
      </div>
    );
  }

  if (viewer.user.role === "teacher") {
    const view = await getTeacherPortalView({
      user: viewer.user,
      permissions: viewer.permissions,
    });

    return (
      <div className="flex flex-col gap-6">
        <Hero
          name={view.viewer.name}
          roleLabel={view.roleLabel}
          permissions={view.permissions}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {view.stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel>
            <SectionHeading
              eyebrow="Assigned classes"
              title="Open and manage your courses"
              description="Teachers only see the classes that belong to them."
            />

            <div className="mt-6 space-y-4">
              {view.classes.map((campusClass) => (
                <div
                  key={campusClass.id}
                  className="rounded-[26px] border border-border bg-white/[0.8] p-4"
                >
                  <p className="font-semibold text-foreground">{campusClass.name}</p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {campusClass.program} | {campusClass.schedule}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-ink-soft">
                    {campusClass.zoomMessage}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeading
              eyebrow="Teaching"
              title="Quick actions"
              description="Jump straight into your class board, schedule, or student list."
            />
            <div className="mt-6 space-y-3">
              <QuickActionCard
                href="/dashboard/classes"
                title="Open classes"
                detail="Host live sessions, upload recordings, and post assignments."
              />
              <QuickActionCard
                href="/dashboard/people"
                title="View students"
                detail="See your roster and the students in your classes."
              />
            </div>
          </Panel>
        </section>
      </div>
    );
  }

  const view = await getOwnerPortalView({
    user: viewer.user,
    permissions: viewer.permissions,
  });

  return (
    <div className="flex flex-col gap-6">
      <Hero
        name={view.viewer.name}
        roleLabel={view.roleLabel}
        permissions={view.permissions}
      />

      <section className="grid gap-4 xl:grid-cols-4">
        {view.stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <SectionHeading
            eyebrow="Owner control"
            title="Manage the whole app"
            description="Owners can see all users, all classes, all payments, and all finance records."
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <QuickActionCard
              href="/dashboard/people"
              title="Manage users"
              detail="Add or remove owners, teachers, and students."
            />
            <QuickActionCard
              href="/dashboard/classes"
              title="Manage classes"
              detail="Create courses and assign teachers."
            />
            <QuickActionCard
              href="/dashboard/finance"
              title="Open finance"
              detail="Review payments, income, and expenses."
            />
            <QuickActionCard
              href="/dashboard/settings"
              title="Open settings"
              detail="Security, notifications, and support."
            />
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Operations"
            title="Current control summary"
            description="A real app should make the school’s state obvious at a glance."
          />

          <div className="mt-6 space-y-3">
            {view.classes.slice(0, 3).map((campusClass) => (
              <div
                key={campusClass.id}
                className="rounded-[26px] border border-border bg-white/[0.8] p-4"
              >
                <p className="font-semibold text-foreground">{campusClass.name}</p>
                <p className="mt-1 text-sm leading-7 text-muted">
                  {campusClass.teacherName} | {campusClass.students} students
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
