import prisma from "@/lib/prisma";

export async function GET() {
  const assignments = await prisma.assignment.findMany({
    select: { id: true, title: true },
  });

  return Response.json(assignments);
}