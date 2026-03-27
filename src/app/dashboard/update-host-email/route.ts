import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateTeacherZoomEmail } from "@/lib/portal-data";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (user.role !== "owner") {
    return NextResponse.redirect(new URL("/dashboard/people", request.url), 303);
  }

  const formData = await request.formData();
  const userId = String(formData.get("userId") ?? "").trim();
  const hostEmail = String(formData.get("zoomEmail") ?? "").trim();
  const updated = updateTeacherZoomEmail({
    userId,
    zoomEmail: hostEmail || null,
  });

  if (!updated) {
    return NextResponse.redirect(new URL("/dashboard/people", request.url), 303);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/people");

  return NextResponse.redirect(new URL("/dashboard/people", request.url), 303);
}
