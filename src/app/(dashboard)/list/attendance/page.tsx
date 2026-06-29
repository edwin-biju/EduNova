import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { markAttendance } from "@/lib/actions";
import AttendanceForm from "./AttendanceForm";
import AttendanceControls from "./AttendanceControls";

type Props = {
  searchParams: { lessonId?: string; date?: string; studentId?: string };
};

const AttendancePage = async ({ searchParams }: Props) => {
  const { userId } = await auth();

  const [isTeacher, isParent, isStudent, isAdmin] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: userId! }, select: { id: true, name: true, surname: true } }),
    prisma.parent.findUnique({ where: { id: userId! }, select: { id: true, name: true, surname: true } }),
    prisma.student.findUnique({ where: { id: userId! }, select: { id: true, name: true, surname: true, classId: true } }),
    prisma.admin.findUnique({ where: { id: userId! }, select: { id: true, username: true } }),
  ]);

  // ─── ADMIN VIEW ─────────────────────────────────────────────────
  if (isAdmin) {
    const lessons = await prisma.lesson.findMany({
      select: {
        id: true, name: true, day: true, startTime: true,
        class: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    const today = new Date().toISOString().split("T")[0];
    const selectedDate = searchParams.date ?? today;
    const selectedLessonId = searchParams.lessonId
      ? parseInt(searchParams.lessonId)
      : lessons[0]?.id ?? null;
    const selectedLesson = lessons.find((l) => l.id === selectedLessonId) ?? null;

    const students = selectedLesson
      ? await prisma.student.findMany({
          where: { classId: selectedLesson.class.id },
          select: { id: true, name: true, surname: true },
          orderBy: { name: "asc" },
        })
      : [];

    const existingRecords = selectedLesson
      ? await prisma.attendance.findMany({
          where: {
            lessonId: selectedLessonId!,
            date: {
              gte: new Date(selectedDate),
              lt: new Date(new Date(selectedDate).getTime() + 86400000),
            },
          },
          select: { studentId: true, present: true },
        })
      : [];

    const existingAttendance: Record<string, boolean> = {};
    existingRecords.forEach((r) => { existingAttendance[r.studentId] = r.present; });

    return (
      // ✅ FIX: Removed max-w-3xl mx-auto and matched your global clean dashboard spacing standard
      <div className="bg-white p-6 rounded-2xl m-4 mt-0 shadow-sm border border-gray-100 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance (Management)</h1>
          <p className="text-sm text-gray-500 mt-1">Logged in as Administrator: {isAdmin.username}</p>
        </div>
        <AttendanceControls
          lessons={lessons}
          selectedLessonId={selectedLessonId}
          selectedDate={selectedDate}
          today={today}
        />
        {selectedLesson ? (
          <AttendanceForm
            students={students}
            lessonId={selectedLesson.id}
            lessonName={`${selectedLesson.name} — Class ${selectedLesson.class.name}`}
            date={selectedDate}
            existingAttendance={existingAttendance}
            markAttendance={markAttendance}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            No active academic lessons configured in the database yet.
          </div>
        )}
      </div>
    );
  }

  // ─── TEACHER VIEW ───────────────────────────────────────────────
  if (isTeacher) {
    const lessons = await prisma.lesson.findMany({
      where: { teacherId: userId! },
      select: {
        id: true, name: true, day: true, startTime: true,
        class: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    const today = new Date().toISOString().split("T")[0];
    const selectedDate = searchParams.date ?? today;
    const selectedLessonId = searchParams.lessonId
      ? parseInt(searchParams.lessonId)
      : lessons[0]?.id ?? null;
    const selectedLesson = lessons.find((l) => l.id === selectedLessonId) ?? null;

    const students = selectedLesson
      ? await prisma.student.findMany({
          where: { classId: selectedLesson.class.id },
          select: { id: true, name: true, surname: true },
          orderBy: { name: "asc" },
        })
      : [];

    const existingRecords = selectedLesson
      ? await prisma.attendance.findMany({
          where: {
            lessonId: selectedLessonId!,
            date: {
              gte: new Date(selectedDate),
              lt: new Date(new Date(selectedDate).getTime() + 86400000),
            },
          },
          select: { studentId: true, present: true },
        })
      : [];

    const existingAttendance: Record<string, boolean> = {};
    existingRecords.forEach((r) => { existingAttendance[r.studentId] = r.present; });

    return (
      // ✅ FIX: Removed max-w-3xl layout constraints
      <div className="bg-white p-6 rounded-2xl m-4 mt-0 shadow-sm border border-gray-100 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome, {isTeacher.name} {isTeacher.surname}</p>
        </div>
        <AttendanceControls
          lessons={lessons}
          selectedLessonId={selectedLessonId}
          selectedDate={selectedDate}
          today={today}
        />
        {selectedLesson ? (
          <AttendanceForm
            students={students}
            lessonId={selectedLesson.id}
            lessonName={`${selectedLesson.name} — Class ${selectedLesson.class.name}`}
            date={selectedDate}
            existingAttendance={existingAttendance}
            markAttendance={markAttendance}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            No lessons found. You have no assigned lessons yet.
          </div>
        )}
      </div>
    );
  }

  // ─── PARENT VIEW ────────────────────────────────────────────────
  if (isParent) {
    const children = await prisma.student.findMany({
      where: { parentId: userId! },
      select: { id: true, name: true, surname: true, classId: true },
    });

    const selectedStudentId = searchParams.studentId ?? children[0]?.id ?? null;
    const selectedChild = children.find((c) => c.id === selectedStudentId) ?? children[0] ?? null;

    const records = selectedChild
      ? await prisma.attendance.findMany({
          where: { studentId: selectedChild.id },
          include: { lesson: { select: { name: true, subject: { select: { name: true } } } } },
          orderBy: { date: "desc" },
          take: 30,
        })
      : [];

    const presentCount = records.filter((r) => r.present).length;
    const absentCount = records.filter((r) => !r.present).length;
    const percentage = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

    return (
      // ✅ FIX: Removed max-w-3xl layout constraints
      <div className="bg-white p-6 rounded-2xl m-4 mt-0 shadow-sm border border-gray-100 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome, {isParent.name} {isParent.surname}</p>
        </div>

        {children.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {children.map((child) => (
              <a
                key={child.id}
                href={`?studentId=${child.id}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                  selectedChild?.id === child.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                {child.name} {child.surname}
              </a>
            ))}
          </div>
        )}

        {selectedChild ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-3xl font-bold text-green-600">{presentCount}</p>
                <p className="text-xs text-gray-500 mt-1">Present</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-3xl font-bold text-red-500">{absentCount}</p>
                <p className="text-xs text-gray-500 mt-1">Absent</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                <p className={`text-3xl font-bold ${percentage >= 75 ? "text-blue-600" : "text-orange-500"}`}>
                  {percentage}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Attendance</p>
              </div>
            </div>

            {percentage < 75 && records.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700 font-medium">
                ⚠️ Attendance is below 75%. Please ensure {selectedChild.name} attends regularly.
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700">
                  Recent Records — {selectedChild.name} {selectedChild.surname}
                </h2>
              </div>
              {records.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No attendance records yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.present ? "bg-green-500" : "bg-red-400"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{r.lesson.name}</p>
                        <p className="text-xs text-gray-400">{r.lesson.subject.name}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        r.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {r.present ? "Present" : "Absent"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            No children found linked to your account.
          </div>
        )}
      </div>
    );
  }

  // ─── STUDENT VIEW ───────────────────────────────────────────────
  if (isStudent) {
    const records = await prisma.attendance.findMany({
      where: { studentId: userId! },
      include: { lesson: { select: { name: true, subject: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      take: 30,
    });

    const presentCount = records.filter((r) => r.present).length;
    const absentCount = records.filter((r) => !r.present).length;
    const percentage = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

    return (
      // ✅ FIX: Removed max-w-3xl layout constraints
      <div className="bg-white p-6 rounded-2xl m-4 mt-0 shadow-sm border border-gray-100 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">{isStudent.name} {isStudent.surname}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-gray-500 mt-1">Present</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-red-500">{absentCount}</p>
            <p className="text-xs text-gray-500 mt-1">Absent</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className={`text-3xl font-bold ${percentage >= 75 ? "text-blue-600" : "text-orange-500"}`}>
              {percentage}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Attendance</p>
          </div>
        </div>

        {percentage < 75 && records.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700 font-medium">
            ⚠️ Your attendance is below 75%. Please attend classes regularly.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Recent Records</h2>
          </div>
          {records.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No attendance records yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {records.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.present ? "bg-green-500" : "bg-red-400"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{r.lesson.name}</p>
                    <p className="text-xs text-gray-400">{r.lesson.subject.name}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    r.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {r.present ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-center text-red-500 font-medium">
      Access denied.
    </div>
  );
};

export default AttendancePage;