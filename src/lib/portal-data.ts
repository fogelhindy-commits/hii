import { prisma } from "@/lib/prisma";

export type UserRole = "owner" | "secretary" | "teacher" | "student";

export type Permission =
  | "users.manage"
  | "classes.manage"
  | "teachers.assign"
  | "retention.manage"
  | "recordings.upload"
  | "assignments.upload"
  | "dashboard.view"
  | "classes.view"
  | "assignments.submit"
  | "recordings.view"
  | "schedule.view"
  | "chat.view"
  | "finance.view"
  | "finance.manage"
  | "reports.view";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  secretary: "Secretary",
  teacher: "Teacher",
  student: "Student",
};

export const PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  owner: [
    "users.manage",
    "classes.manage",
    "teachers.assign",
    "retention.manage",
    "recordings.upload",
    "assignments.upload",
    "dashboard.view",
    "finance.view",
    "reports.view",
  ],
  secretary: ["dashboard.view", "finance.view", "finance.manage", "reports.view"],
  teacher: [
    "dashboard.view",
    "classes.view",
    "recordings.upload",
    "assignments.upload",
    "schedule.view",
    "chat.view",
  ],
  student: [
    "dashboard.view",
    "classes.view",
    "assignments.submit",
    "recordings.view",
    "schedule.view",
    "chat.view",
  ],
};

export type PortalUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  zoomEmail: string | null;
};

export type BillingDocument = {
  id: string;
  kind: "invoice" | "bill";
  recipientName: string;
  recipientId: string | null;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  issueDate: string;
  dueDate: string;
  description: string;
  issuedBy: string;
};

export type StudentPayment = {
  studentId: string;
  plan: string;
  status: "paid" | "unpaid";
  balanceDue: number;
  nextInvoiceDate: string;
};

export type CampusClass = {
  id: string;
  name: string;
  program: string;
  schedule: string;
  room: string;
  teacherId: string | null;
  studentIds: string[];
  liveForDays: number;
  recordingLiveForDays: number;
  zoomMeetingId: string | null;
  zoomJoinUrl: string | null;
  zoomHostUrl: string | null;
};

export type AttendanceItem = {
  id: string;
  classId: string;
  sessionLabel: string;
  date: string;
  present: number;
  absent: number;
  participationRate: number;
};

type RecordingItem = {
  id: string;
  classId: string;
  title: string;
  url: string;
  uploadedAt: string;
  availableUntil: string;
  uploadedBy: string;
};

type AssignmentItem = {
  id: string;
  classId: string;
  title: string;
  dueDate: string;
  summary: string;
  uploadedBy: string;
};

type ClassNoteItem = {
  id: string;
  classId: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy: string;
  audience: "all" | "selected";
  audienceStudentIds: string[];
};

type ClassFileItem = {
  id: string;
  classId: string;
  label: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  audience: "all" | "selected";
  audienceStudentIds: string[];
};

type FinanceItem = {
  id: string;
  label: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  owner: string;
  category: string;
};

type OwnerSettings = {
  defaultClassLiveForDays: number;
  defaultRecordingLiveForDays: number;
};

type PortalDataStore = {
  users: PortalUser[];
  payments: Record<string, StudentPayment>;
  classes: CampusClass[];
  recordings: RecordingItem[];
  assignments: AssignmentItem[];
  classNotes: ClassNoteItem[];
  classFiles: ClassFileItem[];
  attendance: AttendanceItem[];
  finance: FinanceItem[];
  billingDocuments: BillingDocument[];
  settings: OwnerSettings;
};

declare global {
  var __campusHubStore: PortalDataStore | undefined;
}

const INITIAL_STATE: PortalDataStore = {
  users: [
    {
      id: "owner-olivia",
      name: "Olivia Carter",
      email: "olivia@campus-hub.edu",
      role: "owner",
      title: "Campus owner",
      zoomEmail: "olivia.carter@campus-hub.edu",
    },
    {
      id: "teacher-taylor",
      name: "Taylor Brooks",
      email: "taylor@campus-hub.edu",
      role: "teacher",
      title: "Lead teacher",
      zoomEmail: "taylor.brooks@campus-hub.edu",
    },
    {
      id: "teacher-jordan",
      name: "Jordan Lee",
      email: "jordan@campus-hub.edu",
      role: "teacher",
      title: "Adjunct instructor",
      zoomEmail: "jordan.lee@campus-hub.edu",
    },
    {
      id: "secretary-sam",
      name: "Sam Rivera",
      email: "sam@campus-hub.edu",
      role: "secretary",
      title: "Finance secretary",
      zoomEmail: null,
    },
    {
      id: "student-mia",
      name: "Mia Lopez",
      email: "mia@campus-hub.edu",
      role: "student",
      title: "Student",
      zoomEmail: null,
    },
    {
      id: "student-noah",
      name: "Noah Reed",
      email: "noah@campus-hub.edu",
      role: "student",
      title: "Student",
      zoomEmail: null,
    },
    {
      id: "student-ava",
      name: "Ava Patel",
      email: "ava@campus-hub.edu",
      role: "student",
      title: "Student",
      zoomEmail: null,
    },
  ],
  payments: {
    "student-mia": {
      studentId: "student-mia",
      plan: "Campus Plus",
      status: "paid",
      balanceDue: 0,
      nextInvoiceDate: "2026-04-26",
    },
    "student-noah": {
      studentId: "student-noah",
      plan: "Campus Plus",
      status: "unpaid",
      balanceDue: 1250,
      nextInvoiceDate: "2026-03-29",
    },
    "student-ava": {
      studentId: "student-ava",
      plan: "Evening Scholar",
      status: "paid",
      balanceDue: 0,
      nextInvoiceDate: "2026-04-19",
    },
  },
  classes: [
    {
      id: "class-bio-101",
      name: "Biology 101",
      program: "Science program",
      schedule: "Mon, Wed 9:00 AM",
      room: "Lab 2A",
      teacherId: "teacher-taylor",
      studentIds: ["student-mia", "student-noah"],
      liveForDays: 14,
      recordingLiveForDays: 21,
      zoomMeetingId: "8721001",
      zoomJoinUrl: "/live/class-bio-101/join",
      zoomHostUrl: "/live/class-bio-101/host",
    },
    {
      id: "class-writing-204",
      name: "Writing Studio",
      program: "Humanities program",
      schedule: "Tue, Thu 11:30 AM",
      room: "Room 4C",
      teacherId: "teacher-jordan",
      studentIds: ["student-mia", "student-ava"],
      liveForDays: 14,
      recordingLiveForDays: 30,
      zoomMeetingId: "8721002",
      zoomJoinUrl: "/live/class-writing-204/join",
      zoomHostUrl: "/live/class-writing-204/host",
    },
    {
      id: "class-business-310",
      name: "Business Analytics",
      program: "Business program",
      schedule: "Fri 6:00 PM",
      room: "Online",
      teacherId: "teacher-taylor",
      studentIds: ["student-noah", "student-ava"],
      liveForDays: 10,
      recordingLiveForDays: 28,
      zoomMeetingId: null,
      zoomJoinUrl: null,
      zoomHostUrl: null,
    },
  ],
  recordings: [
    {
      id: "recording-bio-1",
      classId: "class-bio-101",
      title: "Cell structure walkthrough",
      url: "https://example.com/recordings/bio-cell-structure",
      uploadedAt: "2026-03-24T13:30:00.000Z",
      availableUntil: "2026-04-14T13:30:00.000Z",
      uploadedBy: "teacher-taylor",
    },
    {
      id: "recording-writing-1",
      classId: "class-writing-204",
      title: "Essay rubric review",
      url: "https://example.com/recordings/writing-rubric",
      uploadedAt: "2026-03-23T16:00:00.000Z",
      availableUntil: "2026-04-22T16:00:00.000Z",
      uploadedBy: "teacher-jordan",
    },
  ],
  assignments: [
    {
      id: "assignment-bio-1",
      classId: "class-bio-101",
      title: "Lab safety checklist",
      dueDate: "2026-03-29",
      summary:
        "Review the safety sheet and submit a one-page checklist before Monday class.",
      uploadedBy: "teacher-taylor",
    },
    {
      id: "assignment-writing-1",
      classId: "class-writing-204",
      title: "Reflection essay",
      dueDate: "2026-04-01",
      summary:
        "Write a short reflection on the class workshop and attach your draft as a PDF.",
      uploadedBy: "teacher-jordan",
    },
  ],
  classNotes: [
    {
      id: "note-bio-1",
      classId: "class-bio-101",
      title: "Lab safety reminder",
      body: "Keep goggles on during the experiment and review page 12 before class.",
      createdAt: "2026-03-24T12:00:00.000Z",
      createdBy: "teacher-taylor",
      audience: "all",
      audienceStudentIds: [],
    },
    {
      id: "note-writing-1",
      classId: "class-writing-204",
      title: "Essay outline",
      body: "Upload a draft outline before the next workshop so feedback is ready.",
      createdAt: "2026-03-23T12:00:00.000Z",
      createdBy: "teacher-jordan",
      audience: "selected",
      audienceStudentIds: ["student-mia"],
    },
  ],
  classFiles: [
    {
      id: "file-bio-1",
      classId: "class-bio-101",
      label: "Biology slides",
      fileName: "biology-week-12.pdf",
      mimeType: "application/pdf",
      size: 18422,
      dataUrl:
        "data:application/pdf;base64,JVBERi0xLjQKJUZha2UgYmlvbG9neSBmaWxlCiUlRU9G",
      uploadedAt: "2026-03-24T12:30:00.000Z",
      uploadedBy: "teacher-taylor",
      audience: "all",
      audienceStudentIds: [],
    },
    {
      id: "file-writing-1",
      classId: "class-writing-204",
      label: "Essay rubric",
      fileName: "essay-rubric.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 22311,
      dataUrl:
        "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBAoAAAAAA",
      uploadedAt: "2026-03-23T12:30:00.000Z",
      uploadedBy: "teacher-jordan",
      audience: "selected",
      audienceStudentIds: ["student-mia", "student-ava"],
    },
  ],
  attendance: [
    {
      id: "attendance-bio-1",
      classId: "class-bio-101",
      sessionLabel: "Week 12 live session",
      date: "2026-03-24",
      present: 18,
      absent: 2,
      participationRate: 90,
    },
    {
      id: "attendance-writing-1",
      classId: "class-writing-204",
      sessionLabel: "Workshop review",
      date: "2026-03-23",
      present: 16,
      absent: 3,
      participationRate: 84,
    },
    {
      id: "attendance-business-1",
      classId: "class-business-310",
      sessionLabel: "Guest lecture",
      date: "2026-03-22",
      present: 14,
      absent: 4,
      participationRate: 78,
    },
  ],
  finance: [
    {
      id: "finance-tuition-1",
      label: "Spring tuition batch",
      amount: 12400,
      date: "2026-03-21",
      type: "income",
      owner: "Student billing office",
      category: "Tuition",
    },
    {
      id: "finance-salary-1",
      label: "Adjunct payroll batch",
      amount: 8950,
      date: "2026-03-22",
      type: "expense",
      owner: "Finance controller",
      category: "Payroll",
    },
    {
      id: "finance-supplies-1",
      label: "Classroom supplies",
      amount: 1320,
      date: "2026-03-24",
      type: "expense",
      owner: "Operations",
      category: "Supplies",
    },
    {
      id: "finance-grant-1",
      label: "Academic support grant",
      amount: 5000,
      date: "2026-03-25",
      type: "income",
      owner: "Advancement office",
      category: "Grants",
    },
  ],
  billingDocuments: [
    {
      id: "bill-mia-1",
      kind: "bill",
      recipientName: "Mia Lopez",
      recipientId: "student-mia",
      amount: 1250,
      status: "paid",
      issueDate: "2026-03-01",
      dueDate: "2026-03-15",
      description: "Enrollment bill for Spring term",
      issuedBy: "Student billing office",
    },
    {
      id: "bill-noah-1",
      kind: "bill",
      recipientName: "Noah Reed",
      recipientId: "student-noah",
      amount: 1250,
      status: "sent",
      issueDate: "2026-03-01",
      dueDate: "2026-03-29",
      description: "Enrollment bill for Spring term",
      issuedBy: "Student billing office",
    },
    {
      id: "invoice-community-1",
      kind: "invoice",
      recipientName: "Campus Foundation",
      recipientId: null,
      amount: 5000,
      status: "paid",
      issueDate: "2026-03-20",
      dueDate: "2026-03-25",
      description: "Grant invoice and reimbursement request",
      issuedBy: "Finance controller",
    },
  ],
  settings: {
    defaultClassLiveForDays: 14,
    defaultRecordingLiveForDays: 21,
  },
};

function cloneStore(store: PortalDataStore): PortalDataStore {
  return {
    users: store.users.map((user) => ({ ...user })),
    payments: Object.fromEntries(
      Object.entries(store.payments).map(([key, value]) => [key, { ...value }]),
    ),
    classes: store.classes.map((campusClass) => ({
      ...campusClass,
      studentIds: [...campusClass.studentIds],
    })),
    recordings: store.recordings.map((recording) => ({ ...recording })),
    assignments: store.assignments.map((assignment) => ({ ...assignment })),
    classNotes: store.classNotes.map((note) => ({ ...note })),
    classFiles: store.classFiles.map((file) => ({ ...file })),
    attendance: store.attendance.map((item) => ({ ...item })),
    finance: store.finance.map((item) => ({ ...item })),
    billingDocuments: store.billingDocuments.map((document) => ({ ...document })),
    settings: { ...store.settings },
  };
}

const APP_STATE_ID = "main";

function normalizeStore(store: Partial<PortalDataStore> | null | undefined) {
  const seed = cloneStore(INITIAL_STATE);

  if (!store) {
    return seed;
  }

  const normalized = {
    ...seed,
    ...store,
    users: Array.isArray(store.users) ? store.users : seed.users,
    payments:
      store.payments && typeof store.payments === "object" ? store.payments : seed.payments,
    classes: Array.isArray(store.classes) ? store.classes : seed.classes,
    recordings: Array.isArray(store.recordings) ? store.recordings : seed.recordings,
    assignments: Array.isArray(store.assignments) ? store.assignments : seed.assignments,
    classNotes: Array.isArray(store.classNotes) ? store.classNotes : seed.classNotes,
    classFiles: Array.isArray(store.classFiles) ? store.classFiles : seed.classFiles,
    attendance: Array.isArray(store.attendance) ? store.attendance : seed.attendance,
    finance: Array.isArray(store.finance) ? store.finance : seed.finance,
    billingDocuments: Array.isArray(store.billingDocuments)
      ? store.billingDocuments
      : seed.billingDocuments,
    settings:
      store.settings && typeof store.settings === "object" ? store.settings : seed.settings,
  } satisfies PortalDataStore;

  return cloneStore(normalized);
}

async function loadStoreFromDatabase() {
  const row = await prisma.appState.findUnique({
    where: { id: APP_STATE_ID },
  });

  if (!row) {
    return cloneStore(INITIAL_STATE);
  }

  try {
    return normalizeStore(JSON.parse(row.data) as Partial<PortalDataStore>);
  } catch {
    return cloneStore(INITIAL_STATE);
  }
}

async function persistStoreToDatabase(store: PortalDataStore) {
  await prisma.appState.upsert({
    where: { id: APP_STATE_ID },
    create: {
      id: APP_STATE_ID,
      data: JSON.stringify(store),
    },
    update: {
      data: JSON.stringify(store),
    },
  });
}

let storeCache = await loadStoreFromDatabase();
let persistQueue = Promise.resolve();

function getStore() {
  if (!globalThis.__campusHubStore) {
    globalThis.__campusHubStore = storeCache;
  }

  return globalThis.__campusHubStore;
}

function saveStore(store: PortalDataStore) {
  storeCache = store;
  globalThis.__campusHubStore = store;
  persistQueue = persistQueue
    .then(() => persistStoreToDatabase(store))
    .catch((error) => {
      console.error("Failed to persist college app state", error);
    });
}

function parseDateInput(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

function formatMonthDayYear(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDateInput(value));
}

function formatMonthDayTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parseDateInput(value));
}

function nextId(prefix: string, values: string[]) {
  return `${prefix}-${values.length + 1}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateLabel(value: string) {
  return formatMonthDayYear(value);
}

export function formatDateTimeLabel(value: string) {
  return formatMonthDayTime(value);
}

export function formatMoney(value: number) {
  return money(value);
}

export function hasPermission(role: UserRole, permission: Permission) {
  return PERMISSIONS_BY_ROLE[role].includes(permission);
}

export function getUsers() {
  return getStore().users.map((user) => ({ ...user }));
}

export function getUserById(id: string) {
  return getStore().users.find((user) => user.id === id);
}

export function getUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();

  return getStore().users.find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );
}

export function getTeachers() {
  return getUsers().filter((user) => user.role === "teacher");
}

export function getSecretaries() {
  return getUsers().filter((user) => user.role === "secretary");
}

export function getStudents() {
  return getUsers().filter((user) => user.role === "student");
}

export function getClasses() {
  return getStore().classes.map((campusClass) => ({
    ...campusClass,
    studentIds: [...campusClass.studentIds],
  }));
}

export function getClassById(id: string) {
  return getStore().classes.find((campusClass) => campusClass.id === id);
}

export function getClassesForStudent(studentId: string) {
  return getClasses().filter((campusClass) => campusClass.studentIds.includes(studentId));
}

export function getClassesForTeacher(teacherId: string) {
  return getClasses().filter((campusClass) => campusClass.teacherId === teacherId);
}

export function getTeacherName(teacherId: string | null) {
  if (!teacherId) {
    return "Unassigned";
  }

  return getUserById(teacherId)?.name ?? "Unassigned";
}

export function getTeacherZoomEmail(teacherId: string | null) {
  if (!teacherId) {
    return null;
  }

  const teacher = getUserById(teacherId);

  if (!teacher || teacher.role !== "teacher") {
    return null;
  }

  return teacher.zoomEmail;
}

export function getPaymentByStudentId(studentId: string) {
  return getStore().payments[studentId] ?? null;
}

export function getRecordingsForClassIds(classIds: string[]) {
  return getStore().recordings
    .filter((recording) => classIds.includes(recording.classId))
    .map((recording) => ({ ...recording }));
}

export function getAssignmentsForClassIds(classIds: string[]) {
  return getStore().assignments
    .filter((assignment) => classIds.includes(assignment.classId))
    .map((assignment) => ({ ...assignment }));
}

export function getClassNotesForClassIds(classIds: string[]) {
  return getStore().classNotes
    .filter((note) => classIds.includes(note.classId))
    .map((note) => ({ ...note }));
}

export function getClassFilesForClassIds(classIds: string[]) {
  return getStore().classFiles
    .filter((file) => classIds.includes(file.classId))
    .map((file) => ({ ...file }));
}

export function getAttendanceForClassIds(classIds: string[]) {
  return getStore().attendance
    .filter((item) => classIds.includes(item.classId))
    .map((item) => ({ ...item }));
}

export function getFinanceItems() {
  return getStore().finance.map((item) => ({ ...item }));
}

export function getBillingDocuments() {
  return getStore().billingDocuments.map((document) => ({ ...document }));
}

export function getOwnerSettings() {
  return { ...getStore().settings };
}

export function getOwnerMetrics() {
  const store = getStore();
  const students = store.users.filter((user) => user.role === "student");
  const teachers = store.users.filter((user) => user.role === "teacher");
  const income = store.finance
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);
  const expenses = store.finance
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);
  const attendanceRates = store.attendance.map((item) => item.participationRate);
  const paidStudents = students.filter((student) =>
    getPaymentByStudentId(student.id)?.status === "paid",
  ).length;
  const outstandingStudents = students.length - paidStudents;
  const avgAttendance =
    attendanceRates.length > 0
      ? Math.round(
          attendanceRates.reduce((total, value) => total + value, 0) /
            attendanceRates.length,
        )
      : 0;
  const avgParticipation =
    attendanceRates.length > 0
      ? Math.round(
          attendanceRates.reduce((total, value) => total + value, 0) /
            attendanceRates.length,
        )
      : 0;

  return {
    totalUsers: store.users.length,
    teachers: teachers.length,
    students: students.length,
    income,
    expenses,
    avgAttendance,
    avgParticipation,
    outstandingStudents,
    paidStudents,
  };
}

export function addUser(input: {
  name: string;
  email: string;
  role: UserRole;
  title: string;
}) {
  const store = getStore();
  const normalizedEmail = input.email.toLowerCase();

  if (store.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error("A user with this email already exists.");
  }

  const idBase = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const id = `${input.role}-${idBase || "user"}-${store.users.length + 1}`;

  const user: PortalUser = {
    id,
    name: input.name,
    email: input.email,
    role: input.role,
    title: input.title,
    zoomEmail: null,
  };

  store.users.push(user);

  if (input.role === "student") {
    store.payments[id] = {
      studentId: id,
      plan: "Campus Plus",
      status: "unpaid",
      balanceDue: 1250,
      nextInvoiceDate: "2026-04-01",
    };

    store.billingDocuments.push({
      id: nextId(
        "bill",
        store.billingDocuments.map((document) => document.id),
      ),
      kind: "bill",
      recipientName: input.name,
      recipientId: id,
      amount: 1250,
      status: "sent",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "2026-04-01",
      description: "Enrollment bill created during student signup",
      issuedBy: "Student billing office",
    });
  }

  saveStore(store);
  return user;
}

export function removeUser(userId: string) {
  const store = getStore();
  const user = store.users.find((entry) => entry.id === userId);

  if (!user) {
    return false;
  }

  store.users = store.users.filter((entry) => entry.id !== userId);
  store.classes = store.classes.map((campusClass) => {
    const updated = { ...campusClass, studentIds: [...campusClass.studentIds] };

    if (user.role === "teacher" && updated.teacherId === userId) {
      updated.teacherId = null;
      updated.zoomMeetingId = null;
      updated.zoomJoinUrl = null;
      updated.zoomHostUrl = null;
    }

    if (user.role === "student") {
      updated.studentIds = updated.studentIds.filter((studentId) => studentId !== userId);
    }

    return updated;
  });

  if (user.role === "student") {
    delete store.payments[userId];
    store.billingDocuments = store.billingDocuments.filter(
      (document) => document.recipientId !== userId,
    );
  }

  saveStore(store);
  return true;
}

export function addFinanceEntry(input: {
  label: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  owner: string;
  category: string;
}) {
  const store = getStore();

  store.finance.push({
    id: nextId(
      "finance",
      store.finance.map((item) => item.id),
    ),
    label: input.label,
    amount: Math.max(0, Math.round(input.amount)),
    date: input.date,
    type: input.type,
    owner: input.owner,
    category: input.category,
  });

  saveStore(store);
}

export function removeFinanceEntry(entryId: string) {
  const store = getStore();
  const before = store.finance.length;
  store.finance = store.finance.filter((item) => item.id !== entryId);
  saveStore(store);
  return store.finance.length !== before;
}

export function addBillingDocument(input: {
  kind: "invoice" | "bill";
  recipientName: string;
  recipientId: string | null;
  amount: number;
  dueDate: string;
  description: string;
  issuedBy: string;
}) {
  const store = getStore();
  const issueDate = new Date().toISOString().slice(0, 10);

  store.billingDocuments.push({
    id: nextId(
      input.kind,
      store.billingDocuments.map((document) => document.id),
    ),
    kind: input.kind,
    recipientName: input.recipientName,
    recipientId: input.recipientId,
    amount: Math.max(0, Math.round(input.amount)),
    status: "sent",
    issueDate,
    dueDate: input.dueDate,
    description: input.description,
    issuedBy: input.issuedBy,
  });

  saveStore(store);
}

export function removeBillingDocument(documentId: string) {
  const store = getStore();
  const before = store.billingDocuments.length;
  store.billingDocuments = store.billingDocuments.filter(
    (document) => document.id !== documentId,
  );
  saveStore(store);
  return store.billingDocuments.length !== before;
}

export function markBillingDocumentPaid(documentId: string) {
  const store = getStore();
  const document = store.billingDocuments.find((entry) => entry.id === documentId);

  if (!document) {
    return false;
  }

  document.status = "paid";

  if (document.recipientId && store.payments[document.recipientId]) {
    store.payments[document.recipientId] = {
      ...store.payments[document.recipientId],
      status: "paid",
      balanceDue: 0,
    };
  }

  saveStore(store);
  return true;
}

export function markStudentPaymentPaid(studentId: string) {
  const store = getStore();
  const payment = store.payments[studentId];

  if (!payment) {
    return false;
  }

  payment.status = "paid";
  payment.balanceDue = 0;
  payment.nextInvoiceDate = "2026-04-30";
  store.billingDocuments = store.billingDocuments.map((document) => {
    if (document.recipientId === studentId) {
      return { ...document, status: "paid" as const };
    }

    return document;
  });

  saveStore(store);
  return true;
}

export function updateTeacherZoomEmail(input: {
  userId: string;
  zoomEmail: string | null;
}) {
  const store = getStore();
  const user = store.users.find((entry) => entry.id === input.userId);

  if (!user || user.role !== "teacher") {
    return false;
  }

  user.zoomEmail = input.zoomEmail;
  saveStore(store);
  return true;
}

export function createClass(input: {
  name: string;
  program: string;
  schedule: string;
  room: string;
  teacherId: string | null;
}) {
  const store = getStore();
  const teacher = input.teacherId
    ? store.users.find(
        (user) => user.id === input.teacherId && user.role === "teacher",
      )
    : null;
  const classId = nextId(
    "class",
    store.classes.map((campusClass) => campusClass.id),
  );
  const campusClass: CampusClass = {
    id: classId,
    name: input.name,
    program: input.program,
    schedule: input.schedule,
    room: input.room,
    teacherId: teacher ? teacher.id : null,
    studentIds: [],
    liveForDays: store.settings.defaultClassLiveForDays,
    recordingLiveForDays: store.settings.defaultRecordingLiveForDays,
    zoomMeetingId: null,
    zoomJoinUrl: null,
    zoomHostUrl: null,
  };

  store.classes.push(campusClass);
  saveStore(store);
  return campusClass;
}

export function assignTeacherToClass(classId: string, teacherId: string | null) {
  const store = getStore();
  const campusClass = store.classes.find((entry) => entry.id === classId);

  if (!campusClass) {
    return false;
  }

  const teacher = teacherId
    ? store.users.find(
        (user) => user.id === teacherId && user.role === "teacher",
      )
    : null;

  campusClass.teacherId = teacher ? teacher.id : null;
  campusClass.zoomMeetingId = null;
  campusClass.zoomJoinUrl = null;
  campusClass.zoomHostUrl = null;
  saveStore(store);
  return true;
}

export function updateClassRetention(input: {
  classId: string;
  liveForDays: number;
  recordingLiveForDays: number;
}) {
  const store = getStore();
  const campusClass = store.classes.find((entry) => entry.id === input.classId);

  if (!campusClass) {
    return false;
  }

  campusClass.liveForDays = Math.max(1, Math.floor(input.liveForDays));
  campusClass.recordingLiveForDays = Math.max(
    1,
    Math.floor(input.recordingLiveForDays),
  );
  saveStore(store);
  return true;
}

export function updateClassZoomLinks(input: {
  classId: string;
  zoomMeetingId: string;
  zoomJoinUrl: string | null;
  zoomHostUrl: string | null;
}) {
  const store = getStore();
  const campusClass = store.classes.find((entry) => entry.id === input.classId);

  if (!campusClass) {
    return false;
  }

  campusClass.zoomMeetingId = input.zoomMeetingId;
  campusClass.zoomJoinUrl = input.zoomJoinUrl;
  campusClass.zoomHostUrl = input.zoomHostUrl;
  saveStore(store);
  return true;
}

export function addRecording(input: {
  classId: string;
  title: string;
  url: string;
  uploadedBy: string;
}) {
  const store = getStore();
  const campusClass = store.classes.find((entry) => entry.id === input.classId);

  if (!campusClass) {
    throw new Error("Class not found.");
  }

  const now = new Date();
  const availableUntil = new Date(now);
  availableUntil.setDate(availableUntil.getDate() + campusClass.recordingLiveForDays);

  store.recordings.push({
    id: nextId(
      "recording",
      store.recordings.map((recording) => recording.id),
    ),
    classId: input.classId,
    title: input.title,
    url: input.url,
    uploadedAt: now.toISOString(),
    availableUntil: availableUntil.toISOString(),
    uploadedBy: input.uploadedBy,
  });

  saveStore(store);
}

export function addAssignment(input: {
  classId: string;
  title: string;
  dueDate: string;
  summary: string;
  uploadedBy: string;
}) {
  const store = getStore();
  const campusClass = store.classes.find((entry) => entry.id === input.classId);

  if (!campusClass) {
    throw new Error("Class not found.");
  }

  store.assignments.push({
    id: nextId(
      "assignment",
      store.assignments.map((assignment) => assignment.id),
    ),
    classId: input.classId,
    title: input.title,
    dueDate: input.dueDate,
    summary: input.summary,
    uploadedBy: input.uploadedBy,
  });

  saveStore(store);
}

export function addClassNote(input: {
  classId: string;
  title: string;
  body: string;
  createdBy: string;
  audience: "all" | "selected";
  audienceStudentIds: string[];
}) {
  const store = getStore();
  const campusClass = store.classes.find((entry) => entry.id === input.classId);

  if (!campusClass) {
    throw new Error("Class not found.");
  }

  store.classNotes.push({
    id: nextId(
      "note",
      store.classNotes.map((note) => note.id),
    ),
    classId: input.classId,
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    audience: input.audience,
    audienceStudentIds: input.audienceStudentIds,
  });

  saveStore(store);
}

export function addClassFile(input: {
  classId: string;
  label: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedBy: string;
  audience: "all" | "selected";
  audienceStudentIds: string[];
}) {
  const store = getStore();
  const campusClass = store.classes.find((entry) => entry.id === input.classId);

  if (!campusClass) {
    throw new Error("Class not found.");
  }

  store.classFiles.push({
    id: nextId(
      "file",
      store.classFiles.map((file) => file.id),
    ),
    classId: input.classId,
    label: input.label,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.size,
    dataUrl: input.dataUrl,
    uploadedAt: new Date().toISOString(),
    uploadedBy: input.uploadedBy,
    audience: input.audience,
    audienceStudentIds: input.audienceStudentIds,
  });

  saveStore(store);
}



