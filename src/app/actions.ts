"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  getSessionUser,
  getPaymentOverrideCookieName,
  requirePermission,
  requireUser,
  deleteCurrentSession,
} from "@/lib/auth";
import {
  authenticateAuthAccount,
  createAuthSession,
  ensureAuthAccount,
  removeAuthAccount,
} from "@/lib/auth-store";
import {
  addAssignment,
  addBillingDocument,
  addFinanceEntry,
  addClassFile,
  addClassNote,
  addRecording,
  addUser,
  assignTeacherToClass,
  createClass,
  getClassById,
  getPaymentByStudentId,
  getUserByEmail,
  getUserById,
  markBillingDocumentPaid,
  markStudentPaymentPaid,
  removeUser,
  removeBillingDocument,
  removeFinanceEntry,
  updateTeacherZoomEmail,
  updateClassRetention,
  type UserRole,
} from "@/lib/portal-data";
import {
  disconnectQuickBooksConnection,
  syncBillToQuickBooks,
  syncInvoiceToQuickBooks,
} from "@/lib/quickbooks";

function getField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function assertTeacherClassAccess(userId: string, role: UserRole, classId: string) {
  const campusClass = getClassById(classId);

  if (!campusClass) {
    throw new Error("Class not found.");
  }

  if (role === "teacher" && campusClass.teacherId !== userId) {
    throw new Error("You can only manage your own classes.");
  }

  return campusClass;
}

export async function loginAction(formData: FormData) {
  const email = getField(formData, "email");
  const password = getField(formData, "password");
  const account = await authenticateAuthAccount({ email, password });
  const user = account ? getUserById(account.userId) : null;

  if (!user) {
    redirect("/login");
  }

  const session = await createAuthSession(user.id);

  if (user.role === "student") {
    const cookieStore = await cookies();
    const payment = getPaymentByStudentId(user.id);
    const paidOverride = cookieStore.get(getPaymentOverrideCookieName(user.id))?.value;

    if (payment?.status === "unpaid" && paidOverride !== "paid") {
      cookieStore.set(SESSION_COOKIE, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      redirect(`/payment?userId=${encodeURIComponent(user.id)}`);
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect(user.role === "secretary" ? "/dashboard/finance" : "/dashboard");
}

export async function logoutAction() {
  await deleteCurrentSession();
  redirect("/login");
}

export async function signupAction(formData: FormData) {
  const name = getField(formData, "name");
  const email = getField(formData, "email");
  const password = getField(formData, "password");
  const role = getField(formData, "role") as UserRole;

  if (!name || !email || !password) {
    throw new Error("Please fill in name, email, and password.");
  }

  if (!["owner", "secretary", "teacher", "student"].includes(role)) {
    throw new Error("Please choose a valid role.");
  }

  if (getUserByEmail(email)) {
    throw new Error("A user with this email already exists.");
  }

  const user = addUser({
    name,
    email,
    role,
    title:
      role === "owner"
        ? "Campus owner"
        : role === "teacher"
          ? "Teacher"
          : role === "secretary"
            ? "Finance secretary"
            : "Student",
  });

  try {
    await ensureAuthAccount({
      userId: user.id,
      email: user.email,
      password,
    });
  } catch (error) {
    removeUser(user.id);
    throw error;
  }

  const session = await createAuthSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  if (user.role === "student") {
    redirect("/payment");
  }

  redirect(user.role === "secretary" ? "/dashboard/finance" : "/dashboard");
}

export async function payNowAction(formData: FormData) {
  const cookieStore = await cookies();
  const userId = getField(formData, "userId");
  const sessionUser = await getSessionUser();
  const user = sessionUser?.role === "student" ? sessionUser : getUserById(userId);

  if (!user || user.role !== "student") {
    redirect("/login");
  }

  cookieStore.set(getPaymentOverrideCookieName(user.id), "paid", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  markStudentPaymentPaid(user.id);

  const session = await createAuthSession(user.id);
  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dashboard");
}

export async function addUserAction(formData: FormData) {
  await requirePermission("users.manage");

  const role = getField(formData, "role");
  const password = getField(formData, "password");

  if (role !== "teacher" && role !== "student" && role !== "secretary") {
    throw new Error("Only teacher, secretary, and student accounts can be created here.");
  }

  if (!password) {
    throw new Error("Please set a password for the new account.");
  }

  const user = addUser({
    name: getField(formData, "name"),
    email: getField(formData, "email"),
    role: role as UserRole,
    title:
      role === "teacher"
        ? "Teacher"
        : role === "secretary"
          ? "Finance secretary"
        : "Student",
  });

  try {
    await ensureAuthAccount({
      userId: user.id,
      email: user.email,
      password,
    });
  } catch (error) {
    removeUser(user.id);
    throw error;
  }

  revalidatePath("/dashboard");
}

export async function removeUserAction(formData: FormData) {
  const user = await requirePermission("users.manage");
  const userId = getField(formData, "userId");

  if (user.id === userId) {
    throw new Error("The owner demo account cannot remove itself.");
  }

  removeUser(userId);
  await removeAuthAccount(userId);
  revalidatePath("/dashboard");
}

export async function updateTeacherZoomEmailAction(formData: FormData) {
  await requirePermission("users.manage");

  const userId = getField(formData, "userId");
  const zoomEmail = getField(formData, "zoomEmail");

  const updated = updateTeacherZoomEmail({
    userId,
    zoomEmail: zoomEmail || null,
  });

  if (!updated) {
    throw new Error("Teacher not found.");
  }

  revalidatePath("/dashboard");
}

export async function addFinanceEntryAction(formData: FormData) {
  await requirePermission("finance.manage");

  const type = getField(formData, "type") === "expense" ? "expense" : "income";

  addFinanceEntry({
    label: getField(formData, "label"),
    amount: Number(getField(formData, "amount")),
    date: getField(formData, "date"),
    type,
    owner: getField(formData, "owner"),
    category: getField(formData, "category"),
  });

  revalidatePath("/dashboard/finance");
}

export async function removeFinanceEntryAction(formData: FormData) {
  await requirePermission("finance.manage");

  removeFinanceEntry(getField(formData, "entryId"));
  revalidatePath("/dashboard/finance");
}

export async function addBillingDocumentAction(formData: FormData) {
  await requirePermission("finance.manage");

  addBillingDocument({
    kind: getField(formData, "kind") === "invoice" ? "invoice" : "bill",
    recipientName: getField(formData, "recipientName"),
    recipientId: getField(formData, "recipientId") || null,
    amount: Number(getField(formData, "amount")),
    dueDate: getField(formData, "dueDate"),
    description: getField(formData, "description"),
    issuedBy: getField(formData, "issuedBy"),
  });

  revalidatePath("/dashboard/finance");
}

export async function syncBillingDocumentToQuickBooksAction(formData: FormData) {
  await requirePermission("finance.manage");

  const kind = getField(formData, "kind") === "bill" ? "bill" : "invoice";
  const recipientName = getField(formData, "recipientName");
  const amount = Number(getField(formData, "amount"));
  const issueDate = getField(formData, "issueDate");
  const dueDate = getField(formData, "dueDate");
  const description = getField(formData, "description");

  if (!recipientName || !amount || !issueDate || !dueDate || !description) {
    throw new Error("Missing billing document data.");
  }

  if (kind === "bill") {
    await syncBillToQuickBooks({
      recipientName,
      amount,
      issueDate,
      dueDate,
      description,
    });
  } else {
    await syncInvoiceToQuickBooks({
      recipientName,
      amount,
      issueDate,
      dueDate,
      description,
    });
  }

  revalidatePath("/dashboard/finance");
}

export async function markBillingDocumentPaidAction(formData: FormData) {
  await requirePermission("finance.manage");

  markBillingDocumentPaid(getField(formData, "documentId"));
  revalidatePath("/dashboard/finance");
}

export async function removeBillingDocumentAction(formData: FormData) {
  await requirePermission("finance.manage");

  removeBillingDocument(getField(formData, "documentId"));
  revalidatePath("/dashboard/finance");
}

export async function disconnectQuickBooksAction() {
  await requirePermission("finance.manage");

  await disconnectQuickBooksConnection();
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/finance");
}

export async function createClassAction(formData: FormData) {
  await requirePermission("classes.manage");

  const teacherId = getField(formData, "teacherId");

  createClass({
    name: getField(formData, "name"),
    program: getField(formData, "program"),
    schedule: getField(formData, "schedule"),
    room: getField(formData, "room"),
    teacherId: teacherId || null,
  });

  revalidatePath("/dashboard");
}

export async function assignTeacherAction(formData: FormData) {
  await requirePermission("teachers.assign");

  const classId = getField(formData, "classId");
  const teacherId = getField(formData, "teacherId");

  assignTeacherToClass(classId, teacherId || null);
  revalidatePath("/dashboard");
}

export async function updateRetentionAction(formData: FormData) {
  await requirePermission("retention.manage");

  const classId = getField(formData, "classId");
  const liveForDays = Number(getField(formData, "liveForDays"));
  const recordingLiveForDays = Number(getField(formData, "recordingLiveForDays"));

  updateClassRetention({
    classId,
    liveForDays: Number.isFinite(liveForDays) ? liveForDays : 14,
    recordingLiveForDays: Number.isFinite(recordingLiveForDays)
      ? recordingLiveForDays
      : 21,
  });

  revalidatePath("/dashboard");
}

export async function addRecordingAction(formData: FormData) {
  const user = await requirePermission("recordings.upload");
  const classId = getField(formData, "classId");

  assertTeacherClassAccess(user.id, user.role, classId);

  addRecording({
    classId,
    title: getField(formData, "title"),
    url: getField(formData, "url"),
    uploadedBy: user.id,
  });

  revalidatePath("/dashboard");
}

export async function addAssignmentAction(formData: FormData) {
  const user = await requirePermission("assignments.upload");
  const classId = getField(formData, "classId");

  assertTeacherClassAccess(user.id, user.role, classId);

  addAssignment({
    classId,
    title: getField(formData, "title"),
    dueDate: getField(formData, "dueDate"),
    summary: getField(formData, "summary"),
    uploadedBy: user.id,
  });

  revalidatePath("/dashboard");
}

export async function addClassNoteAction(formData: FormData) {
  const user = await requirePermission("assignments.upload");
  const classId = getField(formData, "classId");

  assertTeacherClassAccess(user.id, user.role, classId);

  addClassNote({
    classId,
    title: getField(formData, "title"),
    body: getField(formData, "body"),
    createdBy: user.id,
    audience: getField(formData, "audience") === "selected" ? "selected" : "all",
    audienceStudentIds: formData
      .getAll("audienceStudentIds")
      .map((value) => String(value).trim())
      .filter(Boolean),
  });

  revalidatePath("/dashboard/classes");
}

export async function addClassFileAction(formData: FormData) {
  const user = await requirePermission("recordings.upload");
  const classId = getField(formData, "classId");

  assertTeacherClassAccess(user.id, user.role, classId);

  const uploaded = formData.get("file");

  if (!(uploaded instanceof File) || uploaded.size === 0) {
    throw new Error("Please choose a file to upload.");
  }

  const bytes = Buffer.from(await uploaded.arrayBuffer());

  addClassFile({
    classId,
    label: getField(formData, "label") || uploaded.name,
    fileName: uploaded.name,
    mimeType: uploaded.type || "application/octet-stream",
    size: uploaded.size,
    dataUrl: `data:${uploaded.type || "application/octet-stream"};base64,${bytes.toString("base64")}`,
    uploadedBy: user.id,
    audience: getField(formData, "audience") === "selected" ? "selected" : "all",
    audienceStudentIds: formData
      .getAll("audienceStudentIds")
      .map((value) => String(value).trim())
      .filter(Boolean),
  });

  revalidatePath("/dashboard/classes");
}

export async function sendStudentToDashboardAction() {
  await requireUser();
  redirect("/dashboard");
}
