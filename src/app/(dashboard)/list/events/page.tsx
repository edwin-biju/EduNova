import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Event, Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type EventList = Event & { class: Class };

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    {
      header: "Title",
      accessor: "title",
      className: "p-4",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Date & Time",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
            className: "text-right p-4",
          },
        ]
      : []),
  ];

  const renderRow = (item: EventList) => {
    const eventDate = new Date(item.startTime);
    const dayStr = eventDate.toLocaleString("en-US", { day: "2-digit" });
    const monthStr = eventDate.toLocaleString("en-US", { month: "short" });

    const formatTime = (d: Date) => 
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    return (
      <tr
        key={item.id}
        className="border-b border-gray-100 hover:bg-slate-50/70 transition-colors text-sm"
      >
        {/* TITLE & DESCRIPTION */}
        <td className="p-4">
          <div className="flex items-center gap-4">
            {/* Simple Date Block */}
            <div className="w-12 h-12 flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-gray-100 font-mono">
              <span className="text-xs text-gray-400 font-bold uppercase leading-none">{monthStr}</span>
              <span className="text-lg font-black text-gray-800 leading-none mt-0.5">{dayStr}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800 text-base block tracking-tight">{item.title}</span>
              <p className="text-xs text-gray-400 max-w-xs md:max-w-md truncate mt-0.5">{item.description}</p>
            </div>
          </div>
        </td>

        {/* TARGET CLASS */}
        <td className="p-4">
          {item.class?.name ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {item.class.name}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              All Classes
            </span>
          )}
        </td>

        {/* TIME RANGE CHIP */}
        <td className="p-4 hidden md:table-cell">
          <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg text-gray-600 text-xs font-medium">
            <span>{formatTime(item.startTime)}</span>
            <span className="text-gray-300">—</span>
            <span>{formatTime(item.endTime)}</span>
          </div>
        </td>

        {/* ACTIONS */}
        {role === "admin" && (
          <td className="p-4 text-right">
            <div className="inline-flex items-center gap-2">
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
            </div>
          </td>
        )}
      </tr>
    );
  };

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  const query: Prisma.EventWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const roleConditions = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
    parent: { students: { some: { parentId: currentUserId! } } },
  };

  if (role !== "admin") {
    query.OR = [
      { classId: null },
      { class: roleConditions[role as keyof typeof roleConditions] || {} },
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.event.findMany({
      where: { ...query },
      include: { class: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { startTime: "asc" },
    }),
    prisma.event.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-6 rounded-2xl flex-1 m-4 mt-0 shadow-sm border border-gray-100 space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">All Events</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <TableSearch />
          </div>
          <div className="flex items-center gap-2 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow cursor-pointer">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow cursor-pointer">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            {role === "admin" && (
              <div className="ml-1 rounded-full overflow-hidden">
                <FormContainer table="event" type="create" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLE GRID */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <Table columns={columns} renderRow={renderRow} data={data} />
      </div>

      {/* FOOTER */}
      <div className="pt-2">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default EventListPage;