import prisma from "@/lib/prisma";

export async function GET() {
  const students = await prisma.student.findMany({
    select: { id: true, name: true, surname: true },
  });

  return Response.json(students);
}