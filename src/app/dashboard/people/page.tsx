import {
  addUserAction,
  removeUserAction,
} from "@/app/actions";
import { requireDashboardViewer } from "@/lib/auth";
import {
  getClassesForTeacher,
  getStudents,
  getTeachers,
  getUsers,
} from "@/lib/portal-data";
import {
  getOwnerPortalView,
  getStudentPortalView,
  getTeacherPortalView,
} from "@/lib/portal-view";
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
        People
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

export default async function PeoplePage() {
  const viewer = await requireDashboardViewer();

  if (viewer.user.role === "secretary") {
    redirect("/dashboard/finance");
  }

  const users = getUsers();

  if (viewer.user.role === "owner") {
    const view = await getOwnerPortalView({
      user: viewer.user,
      permissions: viewer.permissions,
    });
    const teachers = getTeachers();

    return (
      <div className="flex flex-col gap-6">
        <Hero
          title="Users, access, and account control"
          description="Owners can create accounts, remove access, and keep the portal's role structure clean."
        />

        <section className="grid gap-4 lg:grid-cols-4">
          {view.stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel>
            <SectionHeading
              eyebrow="Create"
              title="Add a new user"
              description="New student or teacher accounts can be added from the owner dashboard."
            />

            <form action={addUserAction} className="mt-6 space-y-4">
              <input
                name="name"
                placeholder="Full name"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <input
                name="email"
                placeholder="Email address"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Temporary password"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              />
              <select
                name="role"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                required
              >
                <option value="">Choose role</option>
                <option value="secretary">Secretary</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5c56]"
              >
                Add user
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              <TinyBadge tone="brand">Teachers: {teachers.length}</TinyBadge>
              <TinyBadge tone="accent">Students: {getStudents().length}</TinyBadge>
            </div>
          </Panel>

          <Panel>
            <SectionHeading
              eyebrow="Directory"
              title="Current campus users"
              description="This is the active account list that powers login and permissions."
            />

            <div className="mt-6 space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-[26px] border border-border bg-white/[0.8] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="mt-1 text-sm leading-7 text-muted">
                        {user.email} | {user.role}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-ink-soft">
                        {user.title}
                      </p>
                      {user.role === "teacher" ? (
                        <p className="mt-1 text-sm leading-7 text-ink-soft">
                          Room host: {user.zoomEmail ?? "Not set"}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <TinyBadge>{user.role}</TinyBadge>
                      {user.role !== "owner" ? (
                        <form action={removeUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
                          >
                            Remove
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>

                  {user.role === "teacher" ? (
                    <form
                      action="/dashboard/update-host-email"
                      className="mt-4 flex flex-col gap-3 sm:flex-row"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        name="zoomEmail"
                        defaultValue={user.zoomEmail ?? ""}
                        placeholder="Teacher host account"
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b05a30]"
                      >
                        Save host account
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
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
    const classes = getClassesForTeacher(viewer.user.id);

    return (
      <div className="flex flex-col gap-6">
        <Hero
          title="Your students and assigned classes"
          description="Teachers only see the classes and students they are allowed to manage."
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {view.stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>

        <Panel>
          <SectionHeading
            eyebrow="Roster"
            title="Students in your classes"
            description="Each class card lists the students enrolled in that class."
          />

          <div className="mt-6 space-y-4">
            {classes.map((campusClass) => {
              const studentNames = getStudents().filter((student) =>
                campusClass.studentIds.includes(student.id),
              );

              return (
                <div
                  key={campusClass.id}
                  className="rounded-[26px] border border-border bg-white/[0.8] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{campusClass.name}</p>
                      <p className="mt-1 text-sm leading-7 text-muted">
                        {campusClass.program} | {campusClass.schedule}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-ink-soft">
                        {studentNames.length} students enrolled
                      </p>
                    </div>
                    <TinyBadge tone="brand">
                      {campusClass.studentIds.length} enrolled
                    </TinyBadge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {studentNames.map((student) => (
                      <TinyBadge key={student.id}>{student.name}</TinyBadge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    );
  }

  const view = await getStudentPortalView({
    user: viewer.user,
    permissions: viewer.permissions,
    payment: viewer.payment!,
  });

  return (
    <div className="flex flex-col gap-6">
      <Hero
        title="Your teachers and class group"
        description="Students can quickly see who teaches their classes and who is sharing the room."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {view.stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <SectionHeading
            eyebrow="Classes"
            title="Your instructors"
            description="These are the teachers attached to your active classes."
          />

          <div className="mt-6 space-y-3">
            {view.classes.map((campusClass) => (
              <div
                key={campusClass.id}
                className="rounded-[24px] border border-border bg-white/[0.8] p-4"
              >
                <p className="font-semibold text-foreground">{campusClass.name}</p>
                <p className="mt-1 text-sm leading-7 text-muted">
                  Teacher: {campusClass.teacherName}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Peers"
            title="Classmates and shared work"
            description="The app can later grow into chat and study groups here."
          />

          <div className="mt-6 space-y-3">
            {view.classes.map((campusClass) => (
              <div
                key={campusClass.id}
                className="rounded-[24px] border border-border bg-white/[0.8] p-4"
              >
                <p className="font-semibold text-foreground">{campusClass.name}</p>
                <p className="mt-1 text-sm leading-7 text-muted">
                  Join your class page to see recordings and assignments.
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
