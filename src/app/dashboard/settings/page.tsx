import Link from "next/link";

import {
  disconnectQuickBooksAction,
  logoutAction,
} from "@/app/actions";
import { requireDashboardViewer } from "@/lib/auth";
import {
  getOwnerPortalView,
  getStudentPortalView,
  getTeacherPortalView,
} from "@/lib/portal-view";
import {
  getQuickBooksConnection,
  getQuickBooksRedirectUri,
} from "@/lib/quickbooks";
import { Panel, SectionHeading, TinyBadge } from "@/components/portal-ui";

export const dynamic = "force-dynamic";

function Hero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Panel>
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
        Settings
      </p>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
          {description}
        </p>
      </div>
    </Panel>
  );
}

export default async function SettingsPage() {
  const viewer = await requireDashboardViewer();
  const quickbooksConnection = await getQuickBooksConnection();

  const view =
    viewer.user.role === "student"
      ? await getStudentPortalView({
          user: viewer.user,
          permissions: viewer.permissions,
          payment: viewer.payment!,
        })
      : viewer.user.role === "teacher"
        ? await getTeacherPortalView({
            user: viewer.user,
            permissions: viewer.permissions,
          })
        : await getOwnerPortalView({
            user: viewer.user,
            permissions: viewer.permissions,
          });

  const canManageFinance =
    viewer.user.role === "owner" || viewer.user.role === "secretary";

  return (
    <div className="flex flex-col gap-6">
      <Hero
        title="Security, notifications, and support"
        description="This is the control room for your own app, where account safety and help live."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {view.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[26px] border border-border bg-white/[0.78] p-5 shadow-[var(--shadow)]"
          >
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              {stat.label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">{stat.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <SectionHeading
            eyebrow="Security"
            title="Protect the app"
            description="Keep login, payment gating, and session control in one place."
          />
          <div className="mt-6 space-y-3">
            <div className="rounded-[24px] border border-border bg-white/[0.8] p-4">
              <p className="text-sm font-semibold text-foreground">Login protection</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Unpaid students are routed to the payment page before the app unlocks.
              </p>
            </div>
            <div className="rounded-[24px] border border-border bg-white/[0.8] p-4">
              <p className="text-sm font-semibold text-foreground">Session control</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Sign out when you need to switch accounts or reset the demo flow.
              </p>
            </div>
          </div>
        </Panel>

        {canManageFinance && (
          <Panel>
            <SectionHeading
              eyebrow="QuickBooks"
              title="Accounting connection"
              description="Use the sandbox connection to push your college invoices and bills into Intuit QuickBooks."
            />
            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-border bg-white/[0.8] p-4">
                <p className="text-sm font-semibold text-foreground">
                  {quickbooksConnection ? "Connected to QuickBooks" : "Not connected yet"}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {quickbooksConnection
                    ? `Realm ${quickbooksConnection.realmId}${quickbooksConnection.companyName ? ` - ${quickbooksConnection.companyName}` : ""}`
                    : "Connect the sandbox company to enable live invoice and bill sync."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <TinyBadge tone={quickbooksConnection ? "brand" : "accent"}>
                  {quickbooksConnection ? "Connected" : "Disconnected"}
                </TinyBadge>
                <TinyBadge>Redirect {getQuickBooksRedirectUri()}</TinyBadge>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/api/quickbooks/connect"
                  className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
                >
                  Connect sandbox
                </Link>
                <form action={disconnectQuickBooksAction}>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
                  >
                    Disconnect
                  </button>
                </form>
              </div>
            </div>
          </Panel>
        )}

        <Panel>
          <SectionHeading
            eyebrow="Notifications"
            title="Reminders and alerts"
            description="Homework reminders, payment reminders, and class alerts can all be added later."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <TinyBadge tone="brand">Homework reminders</TinyBadge>
            <TinyBadge tone="accent">Payment reminders</TinyBadge>
            <TinyBadge>Class start alerts</TinyBadge>
            <TinyBadge>Weekly summary</TinyBadge>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <SectionHeading
            eyebrow="App state"
            title="What this app already controls"
            description="The whole product works without outside providers."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <TinyBadge tone="brand">Live class rooms</TinyBadge>
            <TinyBadge tone="accent">Assignments and grading</TinyBadge>
            <TinyBadge>Payments and invoices</TinyBadge>
            <TinyBadge>Reports and analytics</TinyBadge>
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Support"
            title="Report an issue"
            description="Give users one obvious place to ask for help."
          />
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-border bg-white/[0.8] p-4">
              <p className="text-sm font-semibold text-foreground">Need help?</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Add a support ticket flow later without changing the navigation.
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </div>
        </Panel>
      </section>
    </div>
  );
}
