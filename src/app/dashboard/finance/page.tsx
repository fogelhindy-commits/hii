import {
  addBillingDocumentAction,
  addFinanceEntryAction,
  syncBillingDocumentToQuickBooksAction,
  markBillingDocumentPaidAction,
  removeBillingDocumentAction,
  removeFinanceEntryAction,
} from "@/app/actions";
import { requireDashboardViewer } from "@/lib/auth";
import {
  formatDateLabel,
  formatMoney,
  getBillingDocuments,
  getFinanceItems,
  getStudents,
} from "@/lib/portal-data";
import { getOwnerPortalView, getStudentPortalView } from "@/lib/portal-view";
import { getQuickBooksConnection, getQuickBooksRedirectUri } from "@/lib/quickbooks";
import { MetricCard, Panel, SectionHeading, TinyBadge } from "@/components/portal-ui";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

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
        Finance
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

function SectionShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Panel>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-6">{children}</div>
    </Panel>
  );
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function FinancePage() {
  const viewer = await requireDashboardViewer();
  const financeItems = getFinanceItems();
  const billingDocuments = getBillingDocuments();
  const students = getStudents();
  const quickbooksConnection = await getQuickBooksConnection();

  if (viewer.user.role === "owner" || viewer.user.role === "secretary") {
    const view = await getOwnerPortalView({
      user: viewer.user,
      permissions: viewer.permissions,
    });

    const income = financeItems.filter((item) => item.type === "income");
    const expenses = financeItems.filter((item) => item.type === "expense");

    return (
      <div className="flex flex-col gap-6">
        <Hero
          title="Real bookkeeping for the college"
          description="Add expenses, issue invoices and bills, mark payments complete, and remove expense lines when they are entered in error."
        />

        <section className="grid gap-4 lg:grid-cols-4">
          {view.stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>

        <Panel>
          <SectionHeading
            eyebrow="QuickBooks"
            title="Sandbox connection"
            description="Connect Intuit QuickBooks so this finance desk can push invoices and bills into a real accounting company."
          />
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <TinyBadge tone={quickbooksConnection ? "brand" : "accent"}>
                {quickbooksConnection ? "Connected" : "Not connected"}
              </TinyBadge>
              {quickbooksConnection ? (
                <TinyBadge>Realm {quickbooksConnection.realmId}</TinyBadge>
              ) : null}
              <TinyBadge>Redirect {getQuickBooksRedirectUri()}</TinyBadge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
              >
                Open QuickBooks settings
              </Link>
              <Link
                href="/api/quickbooks/connect"
                className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
              >
                Connect sandbox
              </Link>
            </div>
          </div>
        </Panel>

        <section className="grid gap-6 xl:grid-cols-2">
          <SectionShell
            eyebrow="Ledger"
            title="Add a finance entry"
            description="Use this for tuition income, operational expenses, payroll, or any other ledger line."
          >
            <form action={addFinanceEntryAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  name="type"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                  defaultValue="expense"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  name="date"
                  type="date"
                  defaultValue={todayValue()}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                  required
                />
              </div>
              <input
                name="label"
                placeholder="Entry label"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Amount"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                  required
                />
                <input
                  name="category"
                  placeholder="Category"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                  required
                />
              </div>
              <input
                name="owner"
                placeholder="Department or owner"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
              >
                Save ledger entry
              </button>
            </form>
          </SectionShell>

          <SectionShell
            eyebrow="Billing"
            title="Create invoice or bill"
            description="Send a bill to a new student, or issue an invoice for a payment request."
          >
            <form action={addBillingDocumentAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  name="kind"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                  defaultValue="bill"
                  required
                >
                  <option value="bill">Bill</option>
                  <option value="invoice">Invoice</option>
                </select>
                <input
                  name="dueDate"
                  type="date"
                  defaultValue={todayValue()}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                  required
                />
              </div>
              <input
                name="recipientName"
                placeholder="Recipient name"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <select
                name="recipientId"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                defaultValue=""
              >
                <option value="">Link to a student account (optional)</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Amount"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                  required
                />
                <input
                  name="issuedBy"
                  placeholder="Issued by"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                  required
                />
              </div>
              <textarea
                name="description"
                placeholder="Bill or invoice description"
                rows={4}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b05a30]"
              >
                Create billing document
              </button>
            </form>
          </SectionShell>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel>
            <SectionHeading
              eyebrow="Income"
              title="Operational revenue"
              description="Tuition and grants are tracked as income lines in the ledger."
            />
            <div className="mt-6 space-y-3">
              {income.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-border bg-white/[0.8] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm leading-7 text-muted">
                      {item.owner} | {item.category} | {formatDateLabel(item.date)}
                    </p>
                  </div>
                  <TinyBadge tone="brand">{formatMoney(item.amount)}</TinyBadge>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeading
              eyebrow="Expenses"
              title="Cost center view"
              description="Secretaries can remove expense lines after they are corrected."
            />
            <div className="mt-6 space-y-3">
              {expenses.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-border bg-white/[0.8] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm leading-7 text-muted">
                      {item.owner} | {item.category} | {formatDateLabel(item.date)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TinyBadge tone="accent">{formatMoney(item.amount)}</TinyBadge>
                    <form action={removeFinanceEntryAction}>
                      <input type="hidden" name="entryId" value={item.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel>
          <SectionHeading
            eyebrow="Billing queue"
            title="Invoices and student bills"
            description="Use these documents to track what was charged, what was paid, and what still needs attention."
          />
          <div className="mt-6 space-y-3">
            {billingDocuments.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-4 rounded-[24px] border border-border bg-white/[0.8] p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap gap-2">
                    <TinyBadge tone="brand">
                      {document.kind === "bill" ? "Bill" : "Invoice"}
                    </TinyBadge>
                    <TinyBadge tone={document.status === "paid" ? "brand" : "accent"}>
                      {document.status}
                    </TinyBadge>
                  </div>
                  <p className="mt-3 font-semibold text-foreground">
                    {document.recipientName}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {document.description}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-ink-soft">
                    Issued {formatDateLabel(document.issueDate)} | Due{" "}
                    {formatDateLabel(document.dueDate)} | {document.issuedBy}
                  </p>
                </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TinyBadge tone="accent">{formatMoney(document.amount)}</TinyBadge>
                    {quickbooksConnection ? (
                      <form action={syncBillingDocumentToQuickBooksAction}>
                        <input type="hidden" name="documentId" value={document.id} />
                        <input type="hidden" name="kind" value={document.kind} />
                        <input
                          type="hidden"
                          name="recipientName"
                          value={document.recipientName}
                        />
                        <input type="hidden" name="amount" value={document.amount} />
                        <input type="hidden" name="issueDate" value={document.issueDate} />
                        <input type="hidden" name="dueDate" value={document.dueDate} />
                        <input
                          type="hidden"
                          name="description"
                          value={document.description}
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
                        >
                          Sync to QuickBooks
                        </button>
                      </form>
                    ) : (
                      <Link
                        href="/dashboard/settings"
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
                      >
                        Connect QuickBooks first
                      </Link>
                    )}
                    <form action={markBillingDocumentPaidAction}>
                      <input type="hidden" name="documentId" value={document.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
                      >
                        Mark paid
                      </button>
                    </form>
                  <form action={removeBillingDocumentAction}>
                    <input type="hidden" name="documentId" value={document.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
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
          title="Your payment status and billing reminders"
          description="Students only unlock the rest of the app when the account is paid."
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {view.stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>

        <Panel>
          <SectionHeading
            eyebrow="Account"
            title="Billing summary"
            description="The app checks this status before letting a student into the rest of the portal."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <TinyBadge tone={view.payment.status === "paid" ? "brand" : "accent"}>
              {view.payment.status === "paid" ? "Paid" : "Unpaid"}
            </TinyBadge>
            <TinyBadge>Plan {view.payment.plan}</TinyBadge>
            <TinyBadge>Balance due ${view.payment.balanceDue}</TinyBadge>
            <TinyBadge tone="accent">Next invoice {view.payment.nextInvoiceDate}</TinyBadge>
          </div>
        </Panel>
      </div>
    );
  }

  redirect("/dashboard/classes");
}
