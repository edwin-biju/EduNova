import prisma from "@/lib/prisma";

export async function GET() {
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
  });

  return Response.json(classes);
}