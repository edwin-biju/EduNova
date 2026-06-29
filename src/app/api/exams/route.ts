import prisma from "@/lib/prisma";

export async function GET() {
  const exams = await prisma.exam.findMany({
    select: { id: true, title: true },
  });

  return Response.json(exams);
}