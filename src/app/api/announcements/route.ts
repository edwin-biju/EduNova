import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const roleConditions = {
    student: { students: { some: { id: userId! } } },
    parent: { students: { some: { parentId: userId! } } },
  };

  const announcements = await prisma.announcement.findMany({
    orderBy: { date: "desc" },
    where:
      role === "student" || role === "parent"
        ? {
            OR: [
              { classId: null },
              {
                class:
                  roleConditions[role as keyof typeof roleConditions] || {},
              },
            ],
          }
        : {}, // admin + teacher → no filter
  });

  return Response.json(announcements);
}