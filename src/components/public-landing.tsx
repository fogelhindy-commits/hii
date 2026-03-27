import { loginAction, signupAction } from "@/app/actions";
import { Panel, TinyBadge } from "@/components/portal-ui";

export function PublicLanding() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[34px] border border-border bg-panel shadow-[var(--shadow)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-accent to-brand" />
          <div className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-brand/[0.14] blur-3xl" />
          <div className="absolute -right-20 bottom-10 h-48 w-48 rounded-full bg-accent/[0.14] blur-3xl" />

          <div className="relative grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-10">
            <div className="flex flex-col gap-7">
              <div className="flex flex-wrap gap-3">
                <TinyBadge tone="brand">Standalone College App</TinyBadge>
                <TinyBadge>Live rooms + classes + billing</TinyBadge>
              </div>

              <div className="max-w-3xl">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Build and run your college from one secure app.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-ink-soft sm:text-lg">
                  This portal is designed as your own platform, with built-in live
                  classes, assignment tools, billing, and role-based access for
                  owners, teachers, secretaries, and students.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[26px] border border-border bg-white/[0.78] p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                    Student flow
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    Login {"\u2192"} payment check {"\u2192"} dashboard
                  </p>
                </div>
                <div className="rounded-[26px] border border-border bg-white/[0.78] p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                    Teacher scope
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    Assigned classes only
                  </p>
                </div>
                <div className="rounded-[26px] border border-border bg-white/[0.78] p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                    Owner control
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    Users, payments, analytics
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Panel>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  Sign in
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">
                  Use your campus email
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Enter the email and password you created for your college account.
                </p>

                <form action={loginAction} className="mt-6 space-y-4">
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                    required
                  />
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
                  >
                    Sign in
                  </button>
                </form>
              </Panel>

              <Panel>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  Create account
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">
                  Start a new campus account
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Use owner for the first admin account, then add teachers and students
                  from the dashboard.
                </p>

                <form action={signupAction} className="mt-6 space-y-4">
                  <input
                    name="name"
                    placeholder="Full name"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                    required
                  />
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create password"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                    required
                  />
                  <select
                    name="role"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                    defaultValue="owner"
                    required
                  >
                    <option value="owner">Owner</option>
                    <option value="secretary">Secretary</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b05a30]"
                  >
                    Create account
                  </button>
                </form>
              </Panel>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Panel>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              Live rooms
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              Own your class sessions
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Students join a built-in room experience, and teachers open or host
              class sessions from inside the app.
            </p>
          </Panel>
          <Panel>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              Course center
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              Your own classroom workflow
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Post assignments, collect submissions, publish materials, and grade
              work in one shared system.
            </p>
          </Panel>
          <Panel>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              Billing
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              Built-in finance control
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Track payments, income, and expenses without relying on outside
              finance systems.
            </p>
          </Panel>
        </section>
      </div>
    </main>
  );
}
