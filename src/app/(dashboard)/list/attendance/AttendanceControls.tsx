"use client";

import { useRouter } from "next/navigation";

type Lesson = {
  id: number;
  name: string;
  class: { name: string };
};

type Props = {
  lessons: Lesson[];
  selectedLessonId: number | null;
  selectedDate: string;
  today: string;
};

export default function AttendanceControls({
  lessons,
  selectedLessonId,
  selectedDate,
  today,
}: Props) {
  const router = useRouter();

  function update(lessonId: number | null, date: string) {
    const params = new URLSearchParams();
    if (lessonId) params.set("lessonId", String(lessonId));
    params.set("date", date);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Lesson
        </label>
        <select
          value={selectedLessonId ?? ""}
          onChange={(e) => update(parseInt(e.target.value), selectedDate)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {lessons.length === 0 ? (
            <option value="">No lessons assigned</option>
          ) : (
            lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} — {l.class.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Date
        </label>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => update(selectedLessonId, e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
    </div>
  );
}