import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const ParentPage = async () => {
  const { userId } = auth();
  const currentUserId = userId;
  
  const students = await prisma.student.findMany({
    where: {
      parentId: currentUserId!,
    },
  });

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row min-h-screen">
      
      {/* 👈 LEFT SIDE: WIDE COLUMN AREA (66% on large screens) */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        {students.map((student) => (
          <div 
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[800px]" 
            key={student.id}
          >
            <h1 className="text-xl font-bold text-gray-800 mb-4">
              Schedule ({student.name + " " + student.surname})
            </h1>
            {/* The calendar container element inside will now comfortably span across the layout */}
            {student.classId ? (
              <BigCalendarContainer type="classId" id={student.classId} />
            ) : (
              <p className="text-sm text-gray-400 font-medium">This student is not assigned to a class block yet.</p>
            )}
          </div>
        ))}
        {students.length === 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">No student profiles linked to this parent account yet.</p>
          </div>
        )}
      </div>

      {/* 👉 RIGHT SIDE: COMPACT SIDEBAR COLUMN AREA (33% on large screens) */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <Announcements />
      </div>

    </div>
  );
};

export default ParentPage;