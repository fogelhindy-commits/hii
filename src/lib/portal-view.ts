import {
  ROLE_LABELS,
  getAssignmentsForClassIds,
  getAttendanceForClassIds,
  getClasses,
  getClassesForStudent,
  getClassesForTeacher,
  getFinanceItems,
  getOwnerMetrics,
  getOwnerSettings,
  getPaymentByStudentId,
  getRecordingsForClassIds,
  getStudents,
  getTeacherName,
  getTeacherZoomEmail,
  getUsers,
  formatDateLabel,
  formatDateTimeLabel,
  formatMoney,
  type AttendanceItem,
  type CampusClass,
  type Permission,
  type PortalUser,
  type StudentPayment,
  type UserRole,
} from "@/lib/portal-data";

type BasePortalView = {
  role: UserRole;
  roleLabel: string;
  viewer: PortalUser;
  permissions: Permission[];
};

export type StudentPortalView = BasePortalView & {
  role: "student";
  payment: StudentPayment;
  stats: { label: string; value: string; detail: string }[];
  classes: {
    id: string;
    name: string;
    program: string;
    schedule: string;
    room: string;
    teacherName: string;
    teacherZoomEmail: string | null;
    joinUrl: string | null;
    zoomMessage: string;
    liveForDays: number;
    recordingLiveForDays: number;
  }[];
  recordings: {
    id: string;
    title: string;
    className: string;
    uploadedAt: string;
    availableUntil: string;
    url: string;
  }[];
  assignments: {
    id: string;
    title: string;
    className: string;
    dueDate: string;
    summary: string;
  }[];
};

export type TeacherPortalView = BasePortalView & {
  role: "teacher";
  stats: { label: string; value: string; detail: string }[];
  classes: {
    id: string;
    name: string;
    program: string;
    schedule: string;
    room: string;
    students: number;
    teacherZoomEmail: string | null;
    joinUrl: string | null;
    hostUrl: string | null;
    zoomMessage: string;
    recordingCount: number;
    assignmentCount: number;
  }[];
  attendance: {
    id: string;
    className: string;
    sessionLabel: string;
    date: string;
    present: number;
    absent: number;
    participationRate: number;
  }[];
  recordings: {
    id: string;
    title: string;
    className: string;
    uploadedAt: string;
    availableUntil: string;
    url: string;
  }[];
  assignments: {
    id: string;
    title: string;
    className: string;
    dueDate: string;
    summary: string;
  }[];
};

export type OwnerPortalView = BasePortalView & {
  role: "owner";
  stats: { label: string; value: string; detail: string }[];
  users: {
    id: string;
    name: string;
    email: string;
    zoomEmail: string | null;
    role: string;
    title: string;
    paymentStatus: string;
    classCount: number;
  }[];
  classes: {
    id: string;
    name: string;
    program: string;
    schedule: string;
    room: string;
    teacherId: string | null;
    teacherName: string;
    students: number;
    liveForDays: number;
    recordingLiveForDays: number;
  }[];
  payments: {
    studentId: string;
    studentName: string;
    status: string;
    plan: string;
    balanceDue: string;
    nextInvoiceDate: string;
  }[];
  finance: {
    id: string;
    label: string;
    amount: string;
    date: string;
    type: "income" | "expense";
    owner: string;
  }[];
  settings: {
    defaultClassLiveForDays: number;
    defaultRecordingLiveForDays: number;
  };
};

export type PortalView = StudentPortalView | TeacherPortalView | OwnerPortalView;

function mapAttendanceItems(items: AttendanceItem[], classes: CampusClass[]) {
  const classMap = new Map(classes.map((item) => [item.id, item]));

  return items.map((item) => ({
    id: item.id,
    className: classMap.get(item.classId)?.name ?? "Class",
    sessionLabel: item.sessionLabel,
    date: formatDateLabel(item.date),
    present: item.present,
    absent: item.absent,
    participationRate: item.participationRate,
  }));
}

export async function getStudentPortalView(input: {
  user: PortalUser;
  permissions: Permission[];
  payment: StudentPayment;
}): Promise<StudentPortalView> {
  const classes = getClassesForStudent(input.user.id);
  const classIds = classes.map((item) => item.id);
  const recordings = getRecordingsForClassIds(classIds);
  const assignments = getAssignmentsForClassIds(classIds);

  return {
    role: "student",
    roleLabel: ROLE_LABELS.student,
    viewer: input.user,
    permissions: input.permissions,
    payment: input.payment,
    stats: [
      {
        label: "Classes this week",
        value: `${classes.length}`,
        detail: "Only classes assigned to this student are visible.",
      },
      {
        label: "Available recordings",
        value: `${recordings.length}`,
        detail: "Recordings stay visible based on the owner's retention rules.",
      },
      {
        label: "Open assignments",
        value: `${assignments.length}`,
        detail: "Assignments are pulled from the classes this student can access.",
      },
    ],
    classes: classes.map((item) => {
      const teacherZoomEmail = getTeacherZoomEmail(item.teacherId);

      return {
        id: item.id,
        name: item.name,
        program: item.program,
        schedule: item.schedule,
        room: item.room,
        teacherName: getTeacherName(item.teacherId),
        teacherZoomEmail,
        joinUrl: item.zoomJoinUrl || null,
        zoomMessage: item.zoomJoinUrl
          ? `Live room ready for ${teacherZoomEmail || "the assigned teacher"}.`
          : teacherZoomEmail
            ? `No live room created yet. New sessions for this class can be opened by ${teacherZoomEmail}.`
            : "The assigned teacher does not have a host email on file yet.",
        liveForDays: item.liveForDays,
        recordingLiveForDays: item.recordingLiveForDays,
      };
    }),
    recordings: recordings.map((item) => ({
      id: item.id,
      title: item.title,
      className:
        classes.find((campusClass) => campusClass.id === item.classId)?.name ?? "Class",
      uploadedAt: formatDateTimeLabel(item.uploadedAt),
      availableUntil: formatDateTimeLabel(item.availableUntil),
      url: item.url,
    })),
    assignments: assignments.map((item) => ({
      id: item.id,
      title: item.title,
      className:
        classes.find((campusClass) => campusClass.id === item.classId)?.name ?? "Class",
      dueDate: formatDateLabel(item.dueDate),
      summary: item.summary,
    })),
  };
}

export async function getTeacherPortalView(input: {
  user: PortalUser;
  permissions: Permission[];
}): Promise<TeacherPortalView> {
  const classes = getClassesForTeacher(input.user.id);
  const classIds = classes.map((item) => item.id);
  const recordings = getRecordingsForClassIds(classIds);
  const assignments = getAssignmentsForClassIds(classIds);
  const attendance = getAttendanceForClassIds(classIds);

  return {
    role: "teacher",
    roleLabel: ROLE_LABELS.teacher,
    viewer: input.user,
    permissions: input.permissions,
    stats: [
      {
        label: "Assigned classes",
        value: `${classes.length}`,
        detail: "Teachers only see classes where they are assigned.",
      },
      {
        label: "Attendance snapshots",
        value: `${attendance.length}`,
        detail: "Attendance stays scoped to this teacher's classes.",
      },
      {
        label: "Uploaded content",
        value: `${recordings.length + assignments.length}`,
        detail: "Recordings and assignments published by the teaching team.",
      },
    ],
    classes: classes.map((item) => {
      const teacherZoomEmail = getTeacherZoomEmail(item.teacherId);

      return {
        id: item.id,
        name: item.name,
        program: item.program,
        schedule: item.schedule,
        room: item.room,
        students: item.studentIds.length,
        teacherZoomEmail,
        joinUrl: item.zoomJoinUrl || null,
        hostUrl: item.zoomHostUrl || null,
        zoomMessage: item.zoomHostUrl
          ? `This class is hosted through ${teacherZoomEmail || "the assigned host account"}.`
          : teacherZoomEmail
            ? `No live room created yet. New sessions for this class can be opened by ${teacherZoomEmail}.`
            : "Your host email has not been set by the owner yet, so this class cannot create a live room.",
        recordingCount: recordings.filter((recording) => recording.classId === item.id)
          .length,
        assignmentCount: assignments.filter((assignment) => assignment.classId === item.id)
          .length,
      };
    }),
    attendance: mapAttendanceItems(attendance, classes),
    recordings: recordings.map((item) => ({
      id: item.id,
      title: item.title,
      className:
        classes.find((campusClass) => campusClass.id === item.classId)?.name ?? "Class",
      uploadedAt: formatDateTimeLabel(item.uploadedAt),
      availableUntil: formatDateTimeLabel(item.availableUntil),
      url: item.url,
    })),
    assignments: assignments.map((item) => ({
      id: item.id,
      title: item.title,
      className:
        classes.find((campusClass) => campusClass.id === item.classId)?.name ?? "Class",
      dueDate: formatDateLabel(item.dueDate),
      summary: item.summary,
    })),
  };
}

export async function getOwnerPortalView(input: {
  user: PortalUser;
  permissions: Permission[];
}): Promise<OwnerPortalView> {
  const classes = getClasses();
  const users = getUsers();
  const students = getStudents();
  const metrics = getOwnerMetrics();
  const finance = getFinanceItems();
  const settings = getOwnerSettings();
  const teacherCountByClass = new Map(classes.map((item) => [item.id, item.teacherId]));

  return {
    role: "owner",
    roleLabel: ROLE_LABELS.owner,
    viewer: input.user,
    permissions: input.permissions,
    stats: [
      {
        label: "Total users",
        value: `${metrics.totalUsers}`,
        detail: `${metrics.teachers} teachers and ${metrics.students} students`,
      },
      {
        label: "Income vs expenses",
        value: `${formatMoney(metrics.income)} / ${formatMoney(metrics.expenses)}`,
        detail: "Quick summary of the operational finance queue.",
      },
      {
        label: "Attendance",
        value: `${metrics.avgAttendance}%`,
        detail: `Participation average: ${metrics.avgParticipation}%`,
      },
      {
        label: "Outstanding payments",
        value: `${metrics.outstandingStudents}`,
        detail: `${metrics.paidStudents} students are fully paid.`,
      },
    ],
    users: users.map((user) => {
      const classCount =
        user.role === "teacher"
          ? classes.filter((campusClass) => campusClass.teacherId === user.id).length
          : user.role === "student"
            ? classes.filter((campusClass) => campusClass.studentIds.includes(user.id)).length
            : classes.length;
      const payment = user.role === "student" ? getPaymentByStudentId(user.id) : null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        zoomEmail: user.zoomEmail,
        role: ROLE_LABELS[user.role],
        title: user.title,
        paymentStatus:
          user.role === "student"
            ? payment?.status === "paid"
              ? "Paid"
              : `Unpaid ${formatMoney(payment?.balanceDue ?? 0)}`
            : "N/A",
        classCount,
      };
    }),
    classes: classes.map((item) => ({
      id: item.id,
      name: item.name,
      program: item.program,
      schedule: item.schedule,
      room: item.room,
      teacherId: teacherCountByClass.get(item.id) ?? null,
      teacherName: getTeacherName(item.teacherId),
      students: item.studentIds.length,
      liveForDays: item.liveForDays,
      recordingLiveForDays: item.recordingLiveForDays,
    })),
    payments: students.map((student) => {
      const payment = getPaymentByStudentId(student.id);

      return {
        studentId: student.id,
        studentName: student.name,
        status: payment?.status === "paid" ? "Paid" : "Unpaid",
        plan: payment?.plan ?? "No plan",
        balanceDue: formatMoney(payment?.balanceDue ?? 0),
        nextInvoiceDate: payment?.nextInvoiceDate
          ? formatDateLabel(payment.nextInvoiceDate)
          : "Not scheduled",
      };
    }),
    finance: finance.map((item) => ({
      id: item.id,
      label: item.label,
      amount: formatMoney(item.amount),
      date: formatDateLabel(item.date),
      type: item.type,
      owner: item.owner,
    })),
    settings,
  };
}
