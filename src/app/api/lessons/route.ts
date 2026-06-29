import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        subject: true,
        class: true,
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    return Response.json(lessons);
  } catch (error) {
    console.error("API LESSONS GET ERROR:", error);
    return Response.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}