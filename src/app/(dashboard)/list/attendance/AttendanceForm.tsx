"use client";

import { useState } from "react";

type Student = {
  id: string;
  name: string;
  surname: string;
};

type Props = {
  students: Student[];
  lessonId: number;
  lessonName: string;
  date: string;
  existingAttendance: Record<string, boolean>; // studentId → present
  markAttendance: (formData: FormData) => Promise<void>;
};

export default function AttendanceForm({
  students,
  lessonId,
  lessonName,
  date,
  existingAttendance,
  markAttendance,
}: Props) {
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      students.forEach((s) => {
        initial[s.id] = existingAttendance[s.id] ?? true; // default present
      });
      return initial;
    }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  function toggleAll(present: boolean) {
    const updated: Record<string, boolean> = {};
    students.forEach((s) => (updated[s.id] = present));
    setAttendance(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const fd = new FormData();
    fd.append("lessonId", String(lessonId));
    fd.append("date", date);
    fd.append("attendance", JSON.stringify(attendance));

    await markAttendance(fd);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
        <h2 className="text-white font-bold text-lg">{lessonName}</h2>
        <p className="text-blue-100 text-sm mt-0.5">
          {new Date(date).toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex border-b border-gray-100">
        <div className="flex-1 px-6 py-3 text-center border-r border-gray-100">
          <p className="text-2xl font-bold text-green-600">{presentCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Present</p>
        </div>
        <div className="flex-1 px-6 py-3 text-center border-r border-gray-100">
          <p className="text-2xl font-bold text-red-500">{absentCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Absent</p>
        </div>
        <div className="flex-1 px-6 py-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{students.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100">
        <button
          type="button"
          onClick={() => toggleAll(true)}
          className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition"
        >
          ✓ Mark All Present
        </button>
        <button
          type="button"
          onClick={() => toggleAll(false)}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-medium transition"
        >
          ✗ Mark All Absent
        </button>
      </div>

      {/* Student List */}
      <form onSubmit={handleSubmit}>
        <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
          {students.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              No students in this class.
            </div>
          ) : (
            students.map((student, idx) => {
              const isPresent = attendance[student.id];
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-4 px-6 py-3 transition ${
                    isPresent ? "hover:bg-green-50/50" : "hover:bg-red-50/50 bg-red-50/30"
                  }`}
                >
                  {/* Index */}
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                      isPresent ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  >
                    {student.name[0]}{student.surname[0]}
                  </div>

                  {/* Name */}
                  <span className={`flex-1 text-sm font-medium ${isPresent ? "text-gray-800" : "text-gray-400 line-through"}`}>
                    {student.name} {student.surname}
                  </span>

                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setAttendance((prev) => ({ ...prev, [student.id]: !prev[student.id] }))
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      isPresent ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        isPresent ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>

                  {/* Label */}
                  <span
                    className={`text-xs font-semibold w-12 text-right flex-shrink-0 ${
                      isPresent ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {isPresent ? "Present" : "Absent"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Submit */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              ✓ Attendance saved!
            </span>
          )}
          {!saved && <span />}
          <button
            type="submit"
            disabled={saving || students.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl text-sm font-semibold transition"
          >
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
}