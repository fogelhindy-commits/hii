import { DashboardShell } from "@/components/dashboard-shell";
import { requireDashboardViewer } from "@/lib/auth";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const viewer = await requireDashboardViewer();

  return (
    <DashboardShell
      viewer={viewer.user}
      permissions={viewer.permissions}
      payment={viewer.payment}
      roleLabel={
        viewer.user.role === "owner"
          ? "Owner"
          : viewer.user.role === "secretary"
            ? "Secretary"
          : viewer.user.role === "teacher"
            ? "Teacher"
            : "Student"
      }
    >
      {children}
    </DashboardShell>
  );
}
