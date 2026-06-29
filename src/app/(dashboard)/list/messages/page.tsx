import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { sendMessage } from "@/lib/actions";
import MessageClient from "./MessageClient";

const MessagesPage = async () => {
  const { userId } = await auth(); // ✅ Fix 1: await auth()

  const [isTeacher, isParent, isAdmin, isStudent] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: userId! }, select: { id: true } }),
    prisma.parent.findUnique({ where: { id: userId! }, select: { id: true } }),
    prisma.admin.findUnique({ where: { id: userId! }, select: { id: true } }),
    prisma.student.findUnique({ where: { id: userId! }, select: { id: true } }),
  ]);

  let recipients: { id: string; label: string; role: "Teacher" | "Parent" | "Admin" | "Student" }[] = [];

  if (isTeacher) {
    // Teacher → parents of their students + their own students + all admins
    const lessons = await prisma.lesson.findMany({
      where: { teacherId: userId! },
      select: { classId: true },
    });
    const classIds = [...new Set(lessons.map((l) => l.classId))];

    const students = await prisma.student.findMany({
      where: { classId: { in: classIds } },
      select: { id: true, name: true, surname: true, parentId: true },
    });
    const parentIds = [...new Set(students.map((s) => s.parentId))];

    const [parents, admins] = await Promise.all([
      prisma.parent.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, name: true, surname: true },
      }),
      prisma.admin.findMany({ select: { id: true, username: true } }),
    ]);

    recipients = [
      ...parents.map((p) => ({ id: p.id, label: `${p.name} ${p.surname}`, role: "Parent" as const })),
      ...students.map((s) => ({ id: s.id, label: `${s.name} ${s.surname}`, role: "Student" as const })),
      ...admins.map((a) => ({ id: a.id, label: a.username, role: "Admin" as const })),
    ];

  } else if (isParent) {
    // Parent → only teachers of their students
    const students = await prisma.student.findMany({
      where: { parentId: userId! },
      select: { classId: true },
    });
    const classIds = [...new Set(students.map((s) => s.classId))];

    const lessons = await prisma.lesson.findMany({
      where: { classId: { in: classIds } },
      select: { teacherId: true },
    });
    const teacherIds = [...new Set(lessons.map((l) => l.teacherId))];

    const teachers = await prisma.teacher.findMany({
      where: { id: { in: teacherIds } },
      select: { id: true, name: true, surname: true },
    });

    recipients = teachers.map((t) => ({ id: t.id, label: `${t.name} ${t.surname}`, role: "Teacher" as const }));

  } else if (isStudent) {
    // Student → their class teachers + all admins
    const student = await prisma.student.findUnique({
      where: { id: userId! },
      select: { classId: true },
    });

    const lessons = await prisma.lesson.findMany({
      where: { classId: student?.classId },
      select: { teacherId: true },
    });
    const teacherIds = [...new Set(lessons.map((l) => l.teacherId))];

    const [teachers, admins] = await Promise.all([
      prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true, surname: true },
      }),
      prisma.admin.findMany({ select: { id: true, username: true } }),
    ]);

    recipients = [
      ...teachers.map((t) => ({ id: t.id, label: `${t.name} ${t.surname}`, role: "Teacher" as const })),
      ...admins.map((a) => ({ id: a.id, label: a.username, role: "Admin" as const })),
    ];

  } else if (isAdmin) {
    // ✅ Fix 2: Admin → all teachers + all students + all parents
    const [teachers, students, parents] = await Promise.all([
      prisma.teacher.findMany({ select: { id: true, name: true, surname: true } }),
      prisma.student.findMany({ select: { id: true, name: true, surname: true } }),
      prisma.parent.findMany({ select: { id: true, name: true, surname: true } }),
    ]);

    recipients = [
      ...teachers.map((t) => ({ id: t.id, label: `${t.name} ${t.surname}`, role: "Teacher" as const })),
      ...students.map((s) => ({ id: s.id, label: `${s.name} ${s.surname}`, role: "Student" as const })),
      ...parents.map((p) => ({ id: p.id, label: `${p.name} ${p.surname}`, role: "Parent" as const })),
    ];
  }

  // Always exclude yourself
  recipients = recipients.filter((r) => r.id !== userId);

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId! }, { receiverId: userId! }],
    },
    orderBy: { createdAt: "desc" },
  });

  // Collect all unique sender IDs (excluding current user)
  const senderIds = [...new Set(messages.map((m) => m.senderId).filter((id) => id !== userId))];

  // Look up sender names across all role tables
  const [senderTeachers, senderParents, senderAdmins, senderStudents] = await Promise.all([
    prisma.teacher.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true, surname: true } }),
    prisma.parent.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true, surname: true } }),
    prisma.admin.findMany({ where: { id: { in: senderIds } }, select: { id: true, username: true } }),
    prisma.student.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true, surname: true } }),
  ]);

  const senderMap: Record<string, string> = {};
  senderTeachers.forEach((t) => (senderMap[t.id] = `${t.name} ${t.surname}`));
  senderParents.forEach((p) => (senderMap[p.id] = `${p.name} ${p.surname}`));
  senderAdmins.forEach((a) => (senderMap[a.id] = a.username));
  senderStudents.forEach((s) => (senderMap[s.id] = `${s.name} ${s.surname}`));

  const messagesWithSender = messages.map((m) => ({
    ...m,
    senderName: m.senderId === userId ? "You" : (senderMap[m.senderId] ?? "Unknown"),
  }));

  return (
    <MessageClient
      messages={messagesWithSender}
      recipients={recipients}
      currentUserId={userId!}
      sendMessage={sendMessage}
    />
  );
};

export default MessagesPage;