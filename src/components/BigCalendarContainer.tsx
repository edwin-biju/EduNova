import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  // ✅ Fetch with relations
  const dataRes = await prisma.lesson.findMany({
    where: {
      ...(type === "teacherId"
        ? { teacherId: id as string }
        : { classId: id as number }),
    },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
    },
  });

  console.log("RAW LESSONS:", dataRes);

  // ✅ FIXED mapping (force valid events)
  const events = dataRes.map((lesson, index) => {
    const start = new Date(lesson.startTime);

    // 🔥 FORCE duration (IMPORTANT)
    let end: Date;

    if (!lesson.endTime || lesson.endTime <= lesson.startTime) {
      // fallback → +1 hour
      end = new Date(start.getTime() + 60 * 60 * 1000);
    } else {
      end = new Date(lesson.endTime);
    }

    return {
      id: lesson.id,
      title: `${lesson.subject?.name || "Lesson"} (${lesson.class?.name || ""})`,
      start,
      end,
    };
  });

  console.log("FINAL EVENTS:", events);

  return (
    <div>
      <BigCalendar events={events} />
    </div>
  );
};

export default BigCalendarContainer;