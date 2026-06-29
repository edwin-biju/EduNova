"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "@/lib/prisma"; // Unified global prisma path
import { clerkClient, auth } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

/* ================= SUBJECT ACTIONS ================= */

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

/* ================= CLASS ACTIONS ================= */

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const classId = parseInt(id);

    const existingClass = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!existingClass) {
      console.log(`Delete cancelled: Class with ID ${classId} does not exist.`);
      return { success: false, error: true };
    }

    await prisma.lesson.deleteMany({ where: { classId } });
    await prisma.event.deleteMany({ where: { classId } });
    await prisma.announcement.deleteMany({ where: { classId } });

    await prisma.class.delete({
      where: { id: classId },
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log("DELETE CLASS ERROR:", err);
    return { success: false, error: true };
  }
};

/* ================= TEACHER ACTIONS ================= */

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  let user;

  try {
    // 🧠 SAFELY WRAPPED: Catches asynchronous timeouts, unique constraints, or proxy failures
    user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "teacher" }
    });
  } catch (clerkErr: any) {
    console.log("❌ CLERK USER CREATION CRASHED SAFELY:", clerkErr);
    // Gracefully returns error status back to the react-form-state interface hook
    return { success: false, error: true };
  }

  try {
    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log("❌ PRISMA TEACHER INSERTION ERROR:", err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

/* ================= STUDENT ACTIONS ================= */

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "student" }
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });
    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.attendance.deleteMany({
      where: { studentId: id },
    });

    await prisma.result.deleteMany({
      where: { studentId: id },
    });

    try {
      const client = await clerkClient();
      await client.users.deleteUser(id);
    } catch (clerkErr) {
      console.log(`⚠️ Clerk user deletion skipped: ID ${id} not found in authentication pool.`);
    }

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log("DELETE STUDENT ERROR:", err);
    return { success: false, error: true };
  }
};

/* ================= EXAM ACTIONS ================= */

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

/* ================= ASSIGNMENT ACTIONS ================= */

export const createAssignment = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const title = formData.get("title") as string;
    const startDate = formData.get("startDate") as string;
    const dueDate = formData.get("dueDate") as string;
    const lessonId = formData.get("lessonId") as string;

    await prisma.assignment.create({
      data: {
        title,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        lessonId: parseInt(lessonId),
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log("CREATE ASSIGNMENT ERROR:", err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const startDate = formData.get("startDate") as string;
    const dueDate = formData.get("dueDate") as string;
    const lessonId = formData.get("lessonId") as string;

    await prisma.assignment.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        lessonId: parseInt(lessonId),
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log("UPDATE ERROR:", err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const assignmentId = parseInt(id);

    await prisma.result.deleteMany({
      where: { assignmentId },
    });

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log("DELETE ASSIGNMENT ERROR:", err);
    return { success: false, error: true };
  }
};

/* ================= PARENT ACTIONS ================= */

export const createParent = async (
  currentState: any,
  formData: FormData
) => {
  try {
    const username = formData.get("username") as string;
    const name = formData.get("name") as string;
    const surname = formData.get("surname") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const password = formData.get("password") as string;

    if (!password || password.length < 8) {
      return { success: false, error: true, message: "Password must be at least 8 characters long." };
    }

    const client = await clerkClient();
    const user = await client.users.createUser({
      username,
      password,
      publicMetadata: { role: "parent" },
    });

    await prisma.parent.create({
      data: {
        id: user.id,
        username,
        name,
        surname,
        phone,
        address,
      },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err: any) {
    console.log("CREATE PARENT ERROR:", err);
    
    const clerkErrorMessage = err?.errors?.[0]?.longMessage || "Something went wrong!";
    return { success: false, error: true, message: clerkErrorMessage };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;
    const username = formData.get("username") as string;
    const name = formData.get("name") as string;
    const surname = formData.get("surname") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    await prisma.parent.update({
      where: { id },
      data: {
        username,
        name,
        surname,
        phone,
        address,
      },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.log("UPDATE PARENT ERROR:", err);
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.student.deleteMany({
      where: { parentId: id },
    });

    try {
      const client = await clerkClient();
      await client.users.deleteUser(id);
    } catch (clerkErr) {
      console.log(`Clerk parent deletion skipped: ID ${id} not found.`);
    }

    await prisma.parent.delete({
      where: { id },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.log("DELETE PARENT ERROR:", err);
    return { success: false, error: true };
  }
};

/* ================= LESSON ACTIONS ================= */

export const createLesson = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const subjectId = formData.get("subjectId") as string;
    const classId = formData.get("classId") as string;
    const teacherId = formData.get("teacherId") as string;
    const day = formData.get("day") as string;
    
    const startTimeStr = formData.get("startTimeStr") as string; 
    const endTimeStr = formData.get("endTimeStr") as string;     

    const baseDateStr = new Date().toISOString().split("T")[0];
    const startTime = new Date(`${baseDateStr}T${startTimeStr}:00`);
    const endTime = new Date(`${baseDateStr}T${endTimeStr}:00`);

    const conflictingTeacherLesson = await prisma.lesson.findFirst({
      where: {
        teacherId: teacherId,
        day: day as any,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (conflictingTeacherLesson) {
      console.log(`❌ COLLISION DETECTED: Teacher ${teacherId} is already busy on ${day}.`);
      return { success: false, error: true };
    }

    await prisma.lesson.create({
      data: {
        subjectId: parseInt(subjectId),
        classId: parseInt(classId),
        teacherId: teacherId,
        name: "Lesson",
        day: day as any, 
        startTime,
        endTime,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log("CREATE LESSON ERROR:", err);
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;
    const subjectId = formData.get("subjectId") as string;
    const classId = formData.get("classId") as string;
    const teacherId = formData.get("teacherId") as string;
    const day = formData.get("day") as string;
    
    const startTimeStr = formData.get("startTimeStr") as string;
    const endTimeStr = formData.get("endTimeStr") as string;

    const baseDateStr = new Date().toISOString().split("T")[0];
    const startTime = new Date(`${baseDateStr}T${startTimeStr}:00`);
    const endTime = new Date(`${baseDateStr}T${endTimeStr}:00`);
    const lessonId = parseInt(id);

    const conflictingTeacherLesson = await prisma.lesson.findFirst({
      where: {
        id: { not: lessonId },
        teacherId: teacherId,
        day: day as any,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (conflictingTeacherLesson) {
      console.log(`❌ UPDATE COLLISION DETECTED: Teacher ${teacherId} is already busy elsewhere on ${day}.`);
      return { success: false, error: true };
    }

    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        subjectId: parseInt(subjectId),
        classId: parseInt(classId),
        teacherId: teacherId,
        day: day as any,
        startTime,
        endTime,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log("UPDATE LESSON ERROR:", err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const lessonId = parseInt(id);

    await prisma.attendance.deleteMany({ where: { lessonId } });
    await prisma.exam.deleteMany({ where: { lessonId } });
    await prisma.assignment.deleteMany({ where: { lessonId } });

    await prisma.lesson.delete({ where: { id: lessonId } });
    
    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log("DELETE LESSON ERROR:", err);
    return { success: false, error: true };
  }
};

/* ================= EVENT ACTIONS ================= */

export const createEvent = async (currentState: any, formData: FormData) => {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const classId = formData.get("classId") as string;

    await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        classId: classId ? parseInt(classId) : null,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log("CREATE EVENT ERROR:", err);
    return { success: false, error: true };
  }
};

export const updateEvent = async (currentState: any, formData: FormData) => {
  try {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const classId = formData.get("classId") as string;

    await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        classId: classId ? parseInt(classId) : null,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log("UPDATE EVENT ERROR:", err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (currentState: any, data: FormData) => {
  const id = data.get("id") as string;
  try {
    await prisma.event.delete({ where: { id: parseInt(id) } });
    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log("DELETE EVENT ERROR:", err);
    return { success: false, error: true };
  }
};

/* ================= RESULT ACTIONS ================= */

export async function createResult(prevState: any, formData: FormData) {
  try {
    const studentId = formData.get("studentId") as string;
    const rawExamId = formData.get("examId") as string;
    const rawAssignmentId = formData.get("assignmentId") as string;

    const examId = rawExamId === "" ? null : Number(rawExamId);
    const assignmentId = rawAssignmentId === "" ? null : Number(rawAssignmentId);
    const score = Number(formData.get("score"));

    if (!examId && !assignmentId) {
      return { success: false, error: true };
    }

    await prisma.result.create({
      data: { studentId, examId, assignmentId, score },
    });

    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (error) {
    console.log("CREATE RESULT ERROR:", error);
    return { success: false, error: true };
  }
}

export async function updateResult(prevState: any, formData: FormData) {
  try {
    const id = Number(formData.get("id"));
    const studentId = formData.get("studentId") as string;
    const rawExamId = formData.get("examId") as string;
    const rawAssignmentId = formData.get("assignmentId") as string;

    const examId = rawExamId === "" ? null : Number(rawExamId);
    const assignmentId = rawAssignmentId === "" ? null : Number(rawAssignmentId);
    const score = Number(formData.get("score"));

    await prisma.result.update({
      where: { id },
      data: { studentId, examId, assignmentId, score },
    });

    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (error) {
    console.log("UPDATE RESULT ERROR:", error);
    return { success: false, error: true };
  }
}

export const deleteResult = async (currentState: any, data: FormData) => {
  const id = data.get("id") as string;
  try {
    await prisma.result.delete({
      where: { id: parseInt(id) },
    });
    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.log("DELETE RESULT ERROR:", err);
    return { success: false, error: true };
  }
};

/* ================= ANNOUNCEMENT ACTIONS ================= */

export async function createAnnouncement(prevState: any, formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = new Date(formData.get("date") as string);
    const rawClassId = formData.get("classId") as string;
    const classId = rawClassId === "" ? null : Number(rawClassId);

    await prisma.announcement.create({
      data: { title, description, date, classId },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log("CREATE ANNOUNCEMENT ERROR:", err);
    return { success: false, error: true };
  }
}

export async function updateAnnouncement(prevState: any, formData: FormData) {
  try {
    const id = Number(formData.get("id"));
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = new Date(formData.get("date") as string);
    const rawClassId = formData.get("classId") as string;
    const classId = rawClassId === "" ? null : Number(rawClassId);

    await prisma.announcement.update({
      where: { id },
      data: { title, description, date, classId },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log("UPDATE ANNOUNCEMENT ERROR:", err);
    return { success: false, error: true };
  }
}

export const deleteAnnouncement = async (currentState: any, data: FormData) => {
  const id = data.get("id") as string;
  try {
    await prisma.announcement.delete({
      where: { id: parseInt(id) },
    });
    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log("DELETE ANNOUNCEMENT ERROR:", err);
    return { success: false, error: true };
  }
};

/* ================= MESSAGES & ATTENDANCE ACTIONS ================= */

export async function sendMessage(formData: FormData) {
  const { userId } = await auth();
  const receiverId = formData.get("receiverId") as string;
  const content = formData.get("content") as string;

  if (!userId || !receiverId || !content) return;

  await prisma.message.create({
    data: {
      senderId: userId,
      receiverId,
      content,
    },
  });

  revalidatePath("/list/messages");
}

export async function markAttendance(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return;

  const teacher = await prisma.teacher.findUnique({ where: { id: userId } });
  if (!teacher) return;

  const lessonId = parseInt(formData.get("lessonId") as string);
  const date = new Date(formData.get("date") as string);
  const attendance: Record<string, boolean> = JSON.parse(
    formData.get("attendance") as string
  );

  const upserts = Object.entries(attendance).map(([studentId, present]) =>
    prisma.attendance.upsert({
      where: {
        studentId_lessonId_date: {
          studentId,
          lessonId,
          date,
        },
      },
      update: { present },
      create: {
        studentId,
        lessonId,
        date,
        present,
      },
    })
  );

  await Promise.all(upserts);
  
  revalidatePath("/list/attendance");
}