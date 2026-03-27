import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getClassById, updateClassZoomLinks } from "@/lib/portal-data";

function buildLocalSessionLinks(classId: string) {
  return {
    meetingId: `room-${classId}`,
    joinUrl: `/live/${classId}/join`,
    hostUrl: `/live/${classId}/host`,
  };
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (user.role !== "owner" && user.role !== "teacher") {
    return NextResponse.redirect(new URL("/dashboard/classes", request.url), 303);
  }

  const formData = await request.formData();
  const classId = String(formData.get("classId") ?? "").trim();
  const campusClass = getClassById(classId);

  if (!campusClass) {
    return NextResponse.redirect(new URL("/dashboard/classes", request.url), 303);
  }

  if (user.role === "teacher" && campusClass.teacherId !== user.id) {
    return NextResponse.redirect(new URL("/dashboard/classes", request.url), 303);
  }

  const links = buildLocalSessionLinks(classId);

  updateClassZoomLinks({
    classId,
    zoomMeetingId: links.meetingId,
    zoomJoinUrl: links.joinUrl,
    zoomHostUrl: links.hostUrl,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/classes");

  return NextResponse.redirect(new URL(links.hostUrl, request.url), 303);
}
