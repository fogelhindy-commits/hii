import { requireDashboardViewer } from "@/lib/auth";
import {
  getAssignmentsForClassIds,
  getClasses,
  getClassesForStudent,
  getClassesForTeacher,
  getRecordingsForClassIds,
  getTeacherName,
  formatDateLabel,
  formatDateTimeLabel,
} from "@/lib/portal-data";
import { getOwnerPortalView, getStudentPortalView, getTeacherPortalView } from "@/lib/portal-view";
import { MetricCard, Panel, SectionHeading, TinyBadge } from "@/components/portal-ui";
import { redirect } from "next/navigation";

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
        Schedule
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

export default async function SchedulePage() {
  const viewer = await requireDashboardViewer();

  if (viewer.user.role === "secretary") {
    redirect("/dashboard/finance");
  }

  const classes =
    viewer.user.role === "student"
      ? getClassesForStudent(viewer.user.id)
      : viewer.user.role === "teacher"
        ? getClassesForTeacher(viewer.user.id)
        : getClasses();

  const classIds = classes.map((item) => item.id);
  const assignments = getAssignmentsForClassIds(classIds);
  const recordings = getRecordingsForClassIds(classIds);

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

  return (
    <div className="flex flex-col gap-6">
      <Hero
        title="Daily schedule, deadlines, and study planning"
        description="Classes, homework, and recordings all feed into the same planning surface."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {view.stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <SectionHeading
            eyebrow="Today"
            title="Your live schedule"
            description="The portal can become a dependable planner when classes, deadlines, and recordings are visible together."
          />

          <div className="mt-6 space-y-3">
            {classes.map((campusClass) => (
              <div
                key={campusClass.id}
                className="flex flex-col gap-3 rounded-[24px] border border-border bg-white/[0.8] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {campusClass.name}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {campusClass.schedule} | {campusClass.room}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-ink-soft">
                    Teacher: {getTeacherName(campusClass.teacherId)}
                  </p>
                </div>
                <TinyBadge tone="brand">
                  {campusClass.zoomJoinUrl ? "Live room ready" : "Room pending"}
                </TinyBadge>
              </div>
            ))}

            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col gap-3 rounded-[24px] border border-border bg-white/[0.8] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {assignment.title}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {classes.find((campusClass) => campusClass.id === assignment.classId)?.name ?? "Class"} | Due {formatDateLabel(assignment.dueDate)}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-ink-soft">
                    {assignment.summary}
                  </p>
                </div>
                <TinyBadge tone="accent">Homework</TinyBadge>
              </div>
            ))}

            {recordings.slice(0, 4).map((recording) => (
              <div
                key={recording.id}
                className="flex flex-col gap-3 rounded-[24px] border border-border bg-white/[0.8] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {recording.title}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {classes.find((campusClass) => campusClass.id === recording.classId)?.name ?? "Class"} | Uploaded {formatDateTimeLabel(recording.uploadedAt)}
                  </p>
                </div>
                <TinyBadge>Recording</TinyBadge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Planner"
            title="Study blocks that make sense"
            description="A production calendar can easily sit on top of these same data feeds later."
          />

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-border bg-white/[0.8] p-4">
              <p className="text-sm font-semibold text-foreground">Morning review</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Check live class start times before the day begins.
              </p>
            </div>
            <div className="rounded-[24px] border border-border bg-white/[0.8] p-4">
              <p className="text-sm font-semibold text-foreground">Homework block</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Keep due dates grouped together so students know what to do next.
              </p>
            </div>
            <div className="rounded-[24px] border border-border bg-white/[0.8] p-4">
              <p className="text-sm font-semibold text-foreground">Evening replay</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Review recordings and notes after classes end.
              </p>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}
