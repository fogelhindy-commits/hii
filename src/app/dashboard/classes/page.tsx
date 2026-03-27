import { requireDashboardViewer } from "@/lib/auth";
import {
  addClassFileAction,
  addClassNoteAction,
} from "@/app/actions";
import {
  getOwnerPortalView,
  getStudentPortalView,
  getTeacherPortalView,
} from "@/lib/portal-view";
import {
  MetricCard,
  Panel,
  SectionHeading,
  TinyBadge,
} from "@/components/portal-ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  formatDateTimeLabel,
  getClassFilesForClassIds,
  getClassNotesForClassIds,
  getStudents,
} from "@/lib/portal-data";

export const dynamic = "force-dynamic";

function SectionHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Panel>
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
        {eyebrow}
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

export default async function ClassesPage() {
  const viewer = await requireDashboardViewer();

  if (viewer.user.role === "secretary") {
    redirect("/dashboard/finance");
  }

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
  const classIds = view.classes.map((campusClass) => campusClass.id);
  const notes = getClassNotesForClassIds(classIds);
  const files = getClassFilesForClassIds(classIds);
  const students = getStudents();
  const isStaff = viewer.user.role === "teacher" || viewer.user.role === "owner";
  const visibleNotes =
    view.role === "student"
      ? notes.filter(
          (note) => note.audience === "all" || note.audienceStudentIds.includes(view.viewer.id),
        )
      : notes;
  const visibleFiles =
    view.role === "student"
      ? files.filter(
          (file) => file.audience === "all" || file.audienceStudentIds.includes(view.viewer.id),
        )
      : files;

  return (
    <div className="flex flex-col gap-6">
      <SectionHero
        eyebrow="Classes"
        title="Your classes now live in a dedicated board"
        description="Open live sessions, review recordings, and keep assignments close to the course they belong to."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {view.stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <Panel>
        <SectionHeading
          eyebrow="Course board"
          title="Everything tied to your classes"
          description="This board groups the live room, recordings, assignments, and ownership details into one place."
        />

        <div className="mt-6 space-y-4">
          {view.role === "student"
            ? view.classes.map((campusClass) => (
                <div
                  key={campusClass.id}
                  className="rounded-[28px] border border-border bg-white/[0.82] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-foreground">
                        {campusClass.name}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {campusClass.program} | {campusClass.schedule} | {campusClass.room}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-ink-soft">
                        Teacher: {campusClass.teacherName}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {campusClass.zoomMessage}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {campusClass.joinUrl ? (
                        <a
                          href={campusClass.joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
                        >
                          Join live room
                        </a>
                      ) : (
                        <TinyBadge tone="accent">Waiting for live room</TinyBadge>
                      )}
                      <TinyBadge tone="brand">
                        Live for {campusClass.liveForDays} days
                      </TinyBadge>
                      <TinyBadge tone="accent">
                        Recordings for {campusClass.recordingLiveForDays} days
                      </TinyBadge>
                    </div>
                  </div>
                </div>
              ))
            : view.role === "teacher"
              ? view.classes.map((campusClass) => (
                  <div
                    key={campusClass.id}
                    className="rounded-[28px] border border-border bg-white/[0.82] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xl font-semibold text-foreground">
                          {campusClass.name}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted">
                          {campusClass.program} | {campusClass.schedule} | {campusClass.room}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-ink-soft">
                          {campusClass.students} students enrolled
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted">
                          {campusClass.zoomMessage}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {campusClass.hostUrl ? (
                          <a
                            href={campusClass.hostUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
                          >
                            Open live room
                          </a>
                        ) : null}
                        {campusClass.joinUrl ? (
                          <a
                            href={campusClass.joinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
                          >
                            Student link
                          </a>
                        ) : (
                          <form action="/dashboard/open-live-room" method="post">
                            <input type="hidden" name="classId" value={campusClass.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b05a30]"
                            >
                              Create live room
                            </button>
                          </form>
                        )}
                        <TinyBadge>{campusClass.recordingCount} recordings</TinyBadge>
                        <TinyBadge tone="accent">
                          {campusClass.assignmentCount} assignments
                        </TinyBadge>
                      </div>
                    </div>
                  </div>
                ))
              : view.classes.map((campusClass) => (
                  <div
                    key={campusClass.id}
                    className="rounded-[28px] border border-border bg-white/[0.82] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xl font-semibold text-foreground">
                          {campusClass.name}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted">
                          {campusClass.program} | {campusClass.schedule} | {campusClass.room}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-ink-soft">
                          Teacher: {campusClass.teacherName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <TinyBadge>{campusClass.students} students</TinyBadge>
                        <TinyBadge tone="brand">
                          Live {campusClass.liveForDays} days
                        </TinyBadge>
                        <TinyBadge tone="accent">
                          Recordings {campusClass.recordingLiveForDays} days
                        </TinyBadge>
                      </div>
                    </div>
                  </div>
                ))}
        </div>
      </Panel>

      <Panel>
        <SectionHeading
          eyebrow="Class feed"
          title="Notes and files for the whole class"
          description="Teachers can post notes and upload files here. Students only see the items shared with them."
        />

        {isStaff ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <form action={addClassNoteAction} className="space-y-4 rounded-[28px] border border-border bg-white/[0.8] p-5">
              <p className="text-sm font-semibold text-foreground">Post note</p>
              <select
                name="classId"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                defaultValue=""
                required
              >
                <option value="">Choose class</option>
                {view.classes.map((campusClass) => (
                  <option key={campusClass.id} value={campusClass.id}>
                    {campusClass.name}
                  </option>
                ))}
              </select>
              <input
                name="title"
                placeholder="Note title"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <textarea
                name="body"
                placeholder="Note body"
                rows={4}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <select
                name="audience"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                defaultValue="all"
              >
                <option value="all">Whole class</option>
                <option value="selected">Selected students</option>
              </select>
              <select
                name="audienceStudentIds"
                multiple
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                size={Math.min(6, students.length)}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
              >
                Save note
              </button>
            </form>

            <form action={addClassFileAction} encType="multipart/form-data" className="space-y-4 rounded-[28px] border border-border bg-white/[0.8] p-5">
              <p className="text-sm font-semibold text-foreground">Upload file</p>
              <select
                name="classId"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                defaultValue=""
                required
              >
                <option value="">Choose class</option>
                {view.classes.map((campusClass) => (
                  <option key={campusClass.id} value={campusClass.id}>
                    {campusClass.name}
                  </option>
                ))}
              </select>
              <input
                name="label"
                placeholder="File label"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
              />
              <input
                name="file"
                type="file"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <select
                name="audience"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                defaultValue="all"
              >
                <option value="all">Whole class</option>
                <option value="selected">Selected students</option>
              </select>
              <select
                name="audienceStudentIds"
                multiple
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                size={Math.min(6, students.length)}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b05a30]"
              >
                Upload file
              </button>
            </form>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Notes</p>
            {visibleNotes.map((note) => (
              <div key={note.id} className="rounded-[24px] border border-border bg-white/[0.8] p-4">
                <div className="flex flex-wrap gap-2">
                  <TinyBadge tone="brand">{view.classes.find((campusClass) => campusClass.id === note.classId)?.name ?? "Class"}</TinyBadge>
                  <TinyBadge>{note.audience === "all" ? "Whole class" : "Selected students"}</TinyBadge>
                </div>
                <p className="mt-3 font-semibold text-foreground">{note.title}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{note.body}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                  {formatDateTimeLabel(note.createdAt)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Files</p>
            {visibleFiles.map((file) => (
              <div key={file.id} className="rounded-[24px] border border-border bg-white/[0.8] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <TinyBadge tone="brand">{view.classes.find((campusClass) => campusClass.id === file.classId)?.name ?? "Class"}</TinyBadge>
                      <TinyBadge>{file.audience === "all" ? "Whole class" : "Selected students"}</TinyBadge>
                    </div>
                    <p className="mt-3 font-semibold text-foreground">{file.label}</p>
                    <p className="mt-1 text-sm leading-7 text-muted">
                      {file.fileName} | {file.mimeType}
                    </p>
                  </div>
                  <a
                    href={file.dataUrl}
                    download={file.fileName}
                    className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
                  >
                    Download
                  </a>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                  {formatDateTimeLabel(file.uploadedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <SectionHeading
            eyebrow="Study space"
            title="What the class board unlocks"
            description="Each class can surface live sessions, materials, assignments, and recordings without making the student or teacher jump between systems."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-border bg-white/[0.78] p-4">
              <p className="text-sm font-semibold text-foreground">Live classes</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Live room links, host controls, and waiting-room approvals stay attached to the course.
              </p>
            </div>
            <div className="rounded-[24px] border border-border bg-white/[0.78] p-4">
              <p className="text-sm font-semibold text-foreground">Assignments</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Due dates, homework uploads, and grading can live inside the same class folder.
              </p>
            </div>
            <div className="rounded-[24px] border border-border bg-white/[0.78] p-4">
              <p className="text-sm font-semibold text-foreground">Recordings</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Published sessions remain available for a defined retention window.
              </p>
            </div>
            <div className="rounded-[24px] border border-border bg-white/[0.78] p-4">
              <p className="text-sm font-semibold text-foreground">Class materials</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                PDFs, docs, slides, and notes can be attached to the course feed.
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Shortcuts"
            title="Jump to the next step"
            description="Use the sidebar to move to schedule, finance, people, or settings without losing your place."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/schedule"
              className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
            >
              Open schedule
            </Link>
            <Link
              href="/dashboard/finance"
              className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
            >
              Open finance
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}
