import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Attendance, Class, Result, Student, Teacher } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";

// TypeScript strict relation models mapping definitions
type CompleteStudentReport = Student & {
  class: Class | null;
  attendances: Attendance[];
  results: (Result & {
    exam?: { title: string } | null;
    assignment?: { title: string } | null;
  })[];
};

interface ReportsPageProps {
  searchParams: { studentId?: string };
}

const ReportsHubPage = async ({ searchParams }: ReportsPageProps) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  let activeStudentId = searchParams?.studentId;

  // 🔒 Auto-lock parameter values safely if logged in as a student
  if (role === "student") {
    activeStudentId = userId!;
  }

  // 👨‍👩‍👦 Auto-lookup mapping configuration if logged in as a parent
  if (role === "parent" && !activeStudentId) {
    const connectedChild = await prisma.student.findFirst({
      where: { parentId: userId! },
      select: { id: true },
    });
    if (connectedChild) {
      activeStudentId = connectedChild.id;
    }
  }

  // =========================================================
  // 🏛️ 1. TEACHER / ADMIN MAIN VIEW: THE CSV GENERATION HUB
  // =========================================================
  if (!activeStudentId && (role === "admin" || role === "teacher")) {
    
    // Fetch system counters directly from live tables
    const [studentCount, teacherCount, classCount, attendanceCount, students, teachers] = await prisma.$transaction([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.attendance.count(),
      prisma.student.findMany({ include: { class: { select: { name: true } } } }),
      prisma.teacher.findMany(),
    ]);

    // Format safe client-side data pass injections safely
    const formattedStudents = students.map(s => ({
      id: s.id, name: s.name, surname: s.surname, className: s.class?.name || "N/A", phone: s.phone || "-", address: s.address.replace(/"/g, '""')
    }));
    const formattedTeachers = teachers.map(t => ({
      id: t.id, name: t.name, surname: t.surname, email: t.email || "-", phone: t.phone || "-"
    }));

    return (
      <div className="bg-white p-6 rounded-2xl m-4 mt-0 shadow-sm border border-gray-100 flex-1 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports Generation Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Compile, evaluate, and extract data spreadsheets for institutional logs.</p>
        </div>

        {/* STATS OVERVIEW GRIDS */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Institutional Statistics Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-gray-100 bg-gray-50/50 p-5 rounded-xl">
              <span className="text-2xl font-bold text-gray-800 block">{studentCount}</span>
              <span className="text-xs text-gray-500 font-medium">Total Enrolled Students</span>
            </div>
            <div className="border border-gray-100 bg-gray-50/50 p-5 rounded-xl">
              <span className="text-2xl font-bold text-gray-800 block">{teacherCount}</span>
              <span className="text-xs text-gray-500 font-medium">Active Teaching Faculty</span>
            </div>
            <div className="border border-gray-100 bg-gray-50/50 p-5 rounded-xl">
              <span className="text-2xl font-bold text-gray-800 block">{classCount}</span>
              <span className="text-xs text-gray-500 font-medium">Configured Classes</span>
            </div>
            <div className="border border-gray-100 bg-gray-50/50 p-5 rounded-xl">
              <span className="text-2xl font-bold text-gray-800 block">{attendanceCount}</span>
              <span className="text-xs text-gray-500 font-medium">Total Attendance Records</span>
            </div>
          </div>
        </div>

        {/* CLIENT CSV TRIGGER ACTION BUTTONS BLOCK CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* STUDENT CSV CARD */}
          <div className="border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:border-blue-300 transition bg-white">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">🎓</div>
            <div>
              <h3 className="font-semibold text-gray-800 text-base">Student System Spreadsheets</h3>
              <p className="text-xs text-gray-500 mt-1">Download a CSV document list containing names, enrolled batches, and structural profile parameters.</p>
            </div>
            <button 
              formAction={`javascript:(() => {
                const headers = ["Student ID","First Name","Last Name","Class","Phone","Address"];
                const data = ${JSON.stringify(formattedStudents)};
                const csv = [headers.join(","), ...data.map(s => [s.id, s.name, s.surname, s.className, s.phone, \`"\${s.address}"\`].join(","))].join("\\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.setAttribute("download", "Student_System_Registry.csv");
                link.click();
              })()`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer text-center block"
            >
              Download Student CSV Report
            </button>
          </div>

          {/* TEACHER CSV CARD */}
          <div className="border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:border-purple-300 transition bg-white">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg">💼</div>
            <div>
              <h3 className="font-semibold text-gray-800 text-base">Faculty Workload Matrix</h3>
              <p className="text-xs text-gray-500 mt-1">Download a sheet containing faculty emails, dynamic phone lines, and institutional load metrics.</p>
            </div>
            <button 
              formAction={`javascript:(() => {
                const headers = ["Faculty ID","Teacher Name","Surname","Email","Phone"];
                const data = ${JSON.stringify(formattedTeachers)};
                const csv = [headers.join(","), ...data.map(t => [t.id, t.name, t.surname, t.email, t.phone].join(","))].join("\\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.setAttribute("download", "Faculty_Workload_Matrix.csv");
                link.click();
              })()`}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer text-center block"
            >
              Download Teacher CSV Report
            </button>
          </div>
        </div>

        {/* OPTIONAL LINK SHORTCUT TO RE-OPEN INDIVIDUAL STUDENT TRANSCRIPTS IF NEEDED */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium">Looking to extract an individual student progress report card? Search them inside your <Link href="/list/students" className="text-blue-500 font-bold hover:underline">Students Directory</Link>.</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // 🎓 2. SCORECARD DISPLAY: FOR STUDENTS, PARENTS, OR DIRECT ENTRY VIEWS
  // =========================================================
  const student = (await prisma.student.findUnique({
    where: { id: activeStudentId },
    include: {
      class: true,
      attendances: true, 
      results: {
        include: {
          exam: { select: { title: true } },
          assignment: { select: { title: true } },
        },
      },
    },
  })) as CompleteStudentReport | null;

  if (!student) return notFound();

  const totalDays = student.attendances?.length || 0;
  const daysPresent = student.attendances?.filter((a) => a.present).length || 0;
  const attendancePercentage = totalDays > 0 ? ((daysPresent / totalDays) * 100).toFixed(0) : "100";

  return (
    <div className="bg-white p-6 rounded-2xl m-4 mt-0 shadow-sm border border-gray-100 flex-1 space-y-6 print:m-0 print:p-0 print:shadow-none print:border-none">
      
      {/* CARD RUNTIME ACTION HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-4">
          {(role === "admin" || role === "teacher") && (
            <Link href="/list/reports" className="text-gray-400 hover:text-gray-700 transition text-sm font-bold bg-gray-50 hover:bg-gray-100 p-2 rounded-xl print:hidden">
              ⬅️ Exit View
            </Link>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800">Academic Transcript Card</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Student: <span className="text-gray-700 font-semibold">{student.name} {student.surname}</span> | Class: <span className="text-gray-700 font-semibold">{student.class?.name || "N/A"}</span>
            </p>
          </div>
        </div>
        <form>
          <button formAction="javascript:window.print()" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer print:hidden">
            🖨️ Print Transcript
          </button>
        </form>
      </div>

      {/* METRIC SUMMARIES GRID */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50/40 border border-blue-100 p-4 rounded-xl">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Attendance Summary</span>
          <h2 className="text-2xl font-extrabold text-blue-900 mt-1">{attendancePercentage}%</h2>
          <p className="text-xs text-gray-500 mt-0.5">Present on {daysPresent} out of {totalDays} logged days.</p>
        </div>
        <div className="bg-purple-50/40 border border-purple-100 p-4 rounded-xl">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Graded Elements</span>
          <h2 className="text-2xl font-extrabold text-purple-900 mt-1">{student.results?.length || 0}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Total evaluations published.</p>
        </div>
      </div>

      {/* MARKS DATAGRID TABLE */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject Mark breakdown</h3>
        <div className="border border-gray-100 rounded-xl overflow-hidden text-sm shadow-sm bg-white">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold text-xs border-b border-gray-100 uppercase tracking-wider">
              <tr>
                <th className="p-3">Assessment Title</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {student.results?.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50/30 transition">
                  <td className="p-3 font-semibold text-gray-800">{res.exam?.title || res.assignment?.title || "Assessment Entry"}</td>
                  <td className="p-3 text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold ${res.examId ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600"}`}>
                      {res.examId ? "Exam" : "Assignment"}
                    </span>
                  </td>
                  <td className="p-3 text-right font-extrabold text-blue-600">{res.score} / 100</td>
                </tr>
              ))}
              {(!student.results || student.results.length === 0) && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-400 font-medium">No marks linked to this profile.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ReportsHubPage;