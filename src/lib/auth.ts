import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  deleteAuthSession,
  getUserIdForSessionToken,
} from "@/lib/auth-store";
import {
  PERMISSIONS_BY_ROLE,
  getPaymentByStudentId,
  getUserById,
  hasPermission,
  type Permission,
  type PortalUser,
  type StudentPayment,
  type UserRole,
} from "@/lib/portal-data";

export const SESSION_COOKIE = "campus-hub-session";
const PAYMENT_OVERRIDE_PREFIX = "campus-hub-payment-";

export type ViewerContext = {
  user: PortalUser;
  permissions: Permission[];
  payment: StudentPayment | null;
};

export function getPaymentOverrideCookieName(userId: string) {
  return `${PAYMENT_OVERRIDE_PREFIX}${userId}`;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return null;
  }

  const userId = await getUserIdForSessionToken(sessionId);

  if (!userId) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return getUserById(userId);
}

export async function getStudentPaymentState(userId: string) {
  const cookieStore = await cookies();
  const payment = getPaymentByStudentId(userId);

  if (!payment) {
    return null;
  }

  const override = cookieStore.get(getPaymentOverrideCookieName(userId))?.value;

  if (override === "paid") {
    return {
      ...payment,
      status: "paid" as const,
      balanceDue: 0,
    };
  }

  return payment;
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return {
    user,
    permissions: PERMISSIONS_BY_ROLE[user.role],
    payment:
      user.role === "student" ? await getStudentPaymentState(user.id) : null,
  };
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: UserRole | UserRole[]) {
  const user = await requireUser();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();

  if (!hasPermission(user.role, permission)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requirePaidStudent() {
  const user = await requireRole("student");
  const payment = await getStudentPaymentState(user.id);

  if (!payment || payment.status !== "paid") {
    redirect("/payment");
  }

  return {
    user,
    payment,
  };
}

export async function requireDashboardViewer() {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.user.role === "student" && viewer.payment?.status !== "paid") {
    redirect("/payment");
  }

  return viewer;
}

export async function redirectSignedInUserHome() {
  const viewer = await getViewerContext();

  if (!viewer) {
    return;
  }

  if (viewer.user.role === "student" && viewer.payment?.status !== "paid") {
    redirect("/payment");
  }

  redirect(viewer.user.role === "secretary" ? "/dashboard/finance" : "/dashboard");
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await deleteAuthSession(sessionId);
  }

  cookieStore.delete(SESSION_COOKIE);
}
