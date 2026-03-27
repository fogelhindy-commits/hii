import { logoutAction, payNowAction } from "@/app/actions";
import { Panel, SectionHeading, TinyBadge } from "@/components/portal-ui";
import { getViewerContext } from "@/lib/auth";
import { getPaymentByStudentId, getUserById } from "@/lib/portal-data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams?: Promise<{ userId?: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedUserId = Array.isArray(resolvedSearchParams?.userId)
    ? resolvedSearchParams.userId[0]
    : resolvedSearchParams?.userId;
  const viewer = await getViewerContext();
  const pendingStudent =
    requestedUserId ? getUserById(requestedUserId) : null;

  if (!viewer && !pendingStudent) {
    redirect("/login");
  }

  const student =
    viewer?.user.role === "student"
      ? viewer.user
      : pendingStudent?.role === "student"
        ? pendingStudent
        : null;

  if (!student) {
    redirect("/dashboard");
  }

  const payment =
    viewer?.user.role === "student"
      ? viewer.payment
      : getPaymentByStudentId(student.id);

  if (!payment || payment.status === "paid") {
    redirect("/dashboard");
  }

  const loggedIn = Boolean(viewer?.user.role === "student");

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[34px] border border-border bg-panel shadow-[var(--shadow)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-brand to-accent" />
          <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-accent/[0.14] blur-3xl" />
          <div className="absolute -right-20 bottom-4 h-40 w-40 rounded-full bg-brand/[0.14] blur-3xl" />

          <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="flex flex-wrap gap-3">
              <TinyBadge tone="accent">Payment required</TinyBadge>
              <TinyBadge>{student.name}</TinyBadge>
              <TinyBadge tone="brand">
                {loggedIn ? "Signed in" : "Pre-login payment"}
              </TinyBadge>
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Pay first, then unlock the app.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-ink-soft sm:text-lg">
              Students who are not paid are sent here before the session is
              created. Once the balance is cleared, the app opens normally.
            </p>
          </div>
        </section>

        <Panel>
          <SectionHeading
            eyebrow="Payment Gate"
            title="Outstanding balance"
            description="This page can handle both a signed-in student and a pre-login payment request."
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-border bg-white/[0.8] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                Plan
              </p>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {payment.plan}
              </p>
            </div>
            <div className="rounded-[24px] border border-border bg-white/[0.8] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                Balance due
              </p>
              <p className="mt-3 text-2xl font-semibold text-accent">
                ${payment.balanceDue}
              </p>
            </div>
            <div className="rounded-[24px] border border-border bg-white/[0.8] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                Next invoice date
              </p>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {payment.nextInvoiceDate}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <form action={payNowAction}>
              <input type="hidden" name="userId" value={student.id} />
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
              >
                Pay now and unlock app
              </button>
            </form>

            {viewer?.user.role === "student" ? (
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
                >
                  Sign out
                </button>
              </form>
            ) : null}
          </div>
        </Panel>
      </div>
    </main>
  );
}
