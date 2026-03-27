import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireDashboardViewer } from "@/lib/auth";
import { getClassById, getTeacherName } from "@/lib/portal-data";
import { TinyBadge } from "@/components/portal-ui";
import { LiveRoomSession } from "@/components/live-room-session";

export const dynamic = "force-dynamic";

type Mode = "join" | "host";

function isMode(value: string): value is Mode {
  return value === "join" || value === "host";
}

export default async function LiveRoomPage({
  params,
}: {
  params: Promise<{ classId: string; mode: string }>;
}) {
  const { classId, mode } = await params;

  if (!isMode(mode)) {
    notFound();
  }

  const campusClass = getClassById(classId);

  if (!campusClass) {
    notFound();
  }

  const viewer = await requireDashboardViewer();
  const isHostMode = mode === "host";
  const sessionCode = `room-${campusClass.id}`;
  const teacherName = getTeacherName(campusClass.teacherId);

  if (viewer.user.role === "student") {
    if (viewer.payment?.status !== "paid") {
      redirect(`/payment?userId=${encodeURIComponent(viewer.user.id)}`);
    }

    if (!campusClass.studentIds.includes(viewer.user.id) || isHostMode) {
      redirect("/dashboard/classes");
    }
  }

  if (viewer.user.role === "teacher" && campusClass.teacherId !== viewer.user.id) {
    redirect("/dashboard/classes");
  }

  const participants = [
    teacherName,
    ...campusClass.studentIds.slice(0, 4).map((studentId) =>
      studentId.replace("student-", "").replaceAll("-", " "),
    ),
  ];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[34px] border border-border bg-panel p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-3">
                <TinyBadge tone="brand">Built-in live room</TinyBadge>
                <TinyBadge>{isHostMode ? "Host mode" : "Join mode"}</TinyBadge>
                <TinyBadge tone="accent">{campusClass.name}</TinyBadge>
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {isHostMode ? "Open class control room" : "Join your live class"}
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/classes"
                className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
              >
                Back to classes
              </Link>
            </div>
          </div>
        </section>

        <LiveRoomSession
          mode={isHostMode ? "host" : "join"}
          className={campusClass.name}
          roomCode={sessionCode}
          teacherName={teacherName}
          participants={participants}
        />
      </div>
    </main>
  );
}
