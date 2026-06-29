"use client";

import {
  deleteClass,
  deleteExam,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  deleteAssignment,
  deleteLesson,
  deleteParent,
  deleteEvent,
  deleteResult,
  deleteAnnouncement,
} from "@/lib/actions";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

// Static forms
import ParentForm from "./forms/ParentForm";
import LessonForm from "./forms/LessonForm";
import EventForm from "./forms/EventForm";
import ResultForm from "./forms/ResultForm"; 
import AnnouncementForm from "./forms/AnnouncementForm";

/* ================= DELETE ACTION MAP ================= */

const deleteActionMap: Record<string, any> = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  assignment: deleteAssignment,
  lesson: deleteLesson,
  parent: deleteParent,
  event: deleteEvent,
  result: deleteResult,
  announcement: deleteAnnouncement,
  attendance: deleteExam,
};

/* ================= DYNAMIC FORMS ================= */

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});

const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});

const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Loading...</h1>,
});

const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});

const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => <h1>Loading...</h1>,
});

const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), {
  loading: () => <h1>Loading...</h1>,
});

/* ================= FORM MAP ================= */

const forms: Record<
  string,
  (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element
> = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  event: (setOpen, type, data, relatedData) => (
    <EventForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  result: (setOpen, type, data, relatedData) => (
    <ResultForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  announcement: (setOpen, type, data, relatedData) => (
    <AnnouncementForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
};

/* ================= COMPONENT ================= */

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";

  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  /* ================= INNER FORM ================= */
  // ✅ FIXED: We pass the table parameter explicitly here to avoid closure/caching mixups
  const Form = ({ targetTable }: { targetTable: string }) => {
    const action = deleteActionMap[targetTable];

    const [state, formAction] = useFormState(
      action || (async () => ({ success: false, error: true })),
      { success: false, error: false }
    );

    useEffect(() => {
      if (state.success) {
        toast.success(`${targetTable} has been deleted!`);
        setOpen(false);
        router.refresh();
      }

      if (state.error) {
        toast.error("Something went wrong!");
      }
    }, [state, targetTable]);

    /* ===== DELETE MODE ===== */
    if (type === "delete" && id) {
      return (
        <form action={formAction} className="p-4 flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />

          <span className="text-center font-medium">
            All data will be lost. Are you sure you want to delete this{" "}
            <b>{targetTable}</b>?
          </span>

          <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md w-max self-center transition cursor-pointer">
            Delete
          </button>
        </form>
      );
    }

    /* ===== CREATE / UPDATE MODE ===== */
    if (type === "create" || type === "update") {
      const formFn = forms[targetTable];

      return formFn ? (
        formFn(setOpen, type, data, relatedData)
      ) : (
        <div className="text-center text-red-500 font-medium p-6">
          ❌ No form available for "<b>{targetTable}</b>"
        </div>
      );
    }

    return <div>Invalid form type</div>;
  };

  /* ================= UI ================= */

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor} hover:scale-105 transition`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>

      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] animate-fadeIn">
            
            {/* ✅ FIXED: Pass the active 'table' prop directly down into the form instance context */}
            <Form targetTable={table} />

            <div
              className="absolute top-4 right-4 cursor-pointer hover:scale-110 transition"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;