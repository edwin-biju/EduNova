import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

// 💻 Inside src/app/api/reports-data/route.ts

if (role === "student" && studentId) {
  const studentData = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      Attendance: true, // ✅ FIXED: Capitalized to match your Prisma Schema model relation name
      results: {        // Keep this lowercase since your old page code uses `student.results`
        include: {
          exam: { select: { title: true } },
          assignment: { select: { title: true } },
        }
      }
    }
  });

  return NextResponse.json({ success: true, studentData });
}

    // Block non-authorized accounts from accessing generic directories
    if (role !== "admin" && role !== "teacher") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    // Admin/Teacher macro query execution
    const [studentCount, teacherCount, classCount, attendanceCount, students, teachers] = await prisma.$transaction([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.attendance.count(),
      prisma.student.findMany({ include: { class: { select: { name: true } } } }),
      prisma.teacher.findMany(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
        attendance: attendanceCount,
      },
      students,
      teachers,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}