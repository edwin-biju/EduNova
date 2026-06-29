export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData: any = {};

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  // Only fetch related data for create/update
  if (type !== "delete") {
    switch (table) {
      // ---------------- SUBJECT ----------------
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;

      // ---------------- CLASS ----------------
      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });

        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });

        relatedData = { teachers: classTeachers, grades: classGrades };
        break;

      // ---------------- TEACHER ----------------
      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;

      // ---------------- STUDENT ----------------
      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });

        const studentClasses = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        });

        const studentParents = await prisma.parent.findMany({
          select: { id: true, name: true, surname: true },
        });

        relatedData = {
          classes: studentClasses,
          grades: studentGrades,
          parents: studentParents,
        };
        break;

      // ---------------- EXAM (FIXED) ----------------
      case "exam":
        const examLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
        });

        console.log("Exam Lessons:", examLessons); // debug

        relatedData = { lessons: examLessons };
        break;

      // ---------------- LESSON (UPDATED FILTER) ----------------
      case "lesson":
        // 🎯 FIXED: Pulling assigned teachers NESTED inside their specific subject relations
        const lessonSubjects = await prisma.subject.findMany({
          where: {
            teachers: {
              some: {}, 
            },
          },
          select: { 
            id: true, 
            name: true,
            teachers: {
              select: { id: true, name: true, surname: true }
            }
          },
        });

        const lessonClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });

        relatedData = {
          subjects: lessonSubjects,
          classes: lessonClasses,
        };
        break;

      // ---------------- EVENT ----------------
      case "event":
        const eventClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });

        relatedData = { classes: eventClasses };
        break;

      default:
        break;
    }
  }

  return (
    <div>
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;