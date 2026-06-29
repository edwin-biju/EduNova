"use client";

import { useFormState } from "react-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createLesson, updateLesson } from "@/lib/actions";

// 🕒 Real school schedule with 5-min intervals, 15-min recess, and a skipped lunch hour
const TIME_SLOTS = [
  { label: "Period 1 (09:30 AM — 10:15 AM)", start: "09:30", end: "10:15" },
  { label: "Period 2 (10:20 AM — 11:05 AM)", start: "10:20", end: "11:05" },
  { label: "Period 3 (11:20 AM — 12:05 PM)", start: "11:20", end: "12:05" },
  { label: "Period 4 (12:10 PM — 12:55 PM)", start: "12:10", end: "12:55" },
  { label: "Period 5 (01:55 PM — 02:40 PM)", start: "13:55", end: "14:40" },
  { label: "Period 6 (02:45 PM — 03:30 PM)", start: "14:45", end: "15:30" },
];

const LessonForm = ({ type, data, setOpen, relatedData }: any) => {
  const action = type === "create" ? createLesson : updateLesson;

  const [state, formAction] = useFormState(action, {
    success: false,
    error: false,
  });

  useEffect(() => {
    if (state.success) {
      toast.success(`Lesson ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
    }
    if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state, type, setOpen]);

  const { subjects, classes } = relatedData || {};

  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(data?.subjectId || "");

  const getDefaultSlotValue = () => {
    if (!data?.startTime || !data?.endTime) return "";
    const startStr = new Date(data.startTime).toTimeString().slice(0, 5);
    const endStr = new Date(data.endTime).toTimeString().slice(0, 5);
    const foundSlot = TIME_SLOTS.find(slot => slot.start === startStr && slot.end === endStr);
    return foundSlot ? JSON.stringify({ start: foundSlot.start, end: foundSlot.end }) : "";
  };

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(getDefaultSlotValue());

  useEffect(() => {
    if (selectedSubjectId && subjects) {
      const activeSub = subjects.find((s: any) => s.id === parseInt(selectedSubjectId));
      if (activeSub && activeSub.teachers) {
        setFilteredTeachers(activeSub.teachers);
      } else {
        setFilteredTeachers([]);
      }
    } else {
      setFilteredTeachers([]);
    }
  }, [selectedSubjectId, subjects]);

  const handleFormSubmit = (formData: FormData) => {
    if (selectedTimeSlot) {
      const { start, end } = JSON.parse(selectedTimeSlot);
      formData.set("startTimeStr", start);
      formData.set("endTimeStr", end);
    }
    formAction(formData);
  };

  return (
    <form action={handleFormSubmit} className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold text-gray-800">
        {type === "create" ? "Create Lesson" : "Update Lesson"}
      </h2>

      {data?.id && <input type="hidden" name="id" value={data.id} />}

      {/* SUBJECT */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">Subject</label>
        <select 
          name="subjectId" 
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
          required
        >
          <option value="">Select Subject</option>
          {subjects?.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* CLASS */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">Class</label>
        <select 
          name="classId" 
          defaultValue={data?.classId}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
          required
        >
          <option value="">Select Class</option>
          {classes?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* TEACHER */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">Teacher</label>
        <select 
          name="teacherId" 
          defaultValue={data?.teacherId}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
          required
        >
          {filteredTeachers.length === 0 ? (
            <option value="">Choose a subject first</option>
          ) : (
            <>
              <option value="">Select Teacher</option>
              {filteredTeachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} {t.surname}</option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* DAY OF THE WEEK */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">Day of the Week</label>
        <select 
          name="day" 
          defaultValue={data?.day || "MONDAY"}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
          required
        >
          <option value="MONDAY">Monday</option>
          <option value="TUESDAY">Tuesday</option>
          <option value="WEDNESDAY">Wednesday</option>
          <option value="THURSDAY">Thursday</option>
          <option value="FRIDAY">Friday</option>
        </select>
      </div>

      {/* FIXED TIME SLOT DROPDOWN */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">Time Slot</label>
        <select 
          value={selectedTimeSlot}
          onChange={(e) => setSelectedTimeSlot(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
          required
        >
          <option value="">Select Time Slot</option>
          {TIME_SLOTS.map((slot, index) => (
            <option key={index} value={JSON.stringify({ start: slot.start, end: slot.end })}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-semibold text-sm transition mt-2">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default LessonForm;