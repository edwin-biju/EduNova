"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { createAssignment, updateAssignment } from "@/lib/actions";

const AssignmentForm = ({ type, data, setOpen }: any) => {
  const action = type === "create" ? createAssignment : updateAssignment;

  const [state, formAction] = useFormState(action, {
    success: false,
    error: false,
  });

  // 🔥 Fetch lessons from API
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await fetch("/api/lessons");
        const data = await res.json();
        setLessons(data);
      } catch (err) {
        console.log("Error fetching lessons:", err);
      }
    };

    fetchLessons();
  }, []);

  // ✅ Handle success / error
  useEffect(() => {
    if (state.success) {
      toast.success(
        type === "create"
          ? "Assignment created!"
          : "Assignment updated!"
      );
      setOpen(false);
    }

    if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state, type, setOpen]);

  return (
    <form action={formAction} className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold">
        {type === "create" ? "Create Assignment" : "Update Assignment"}
      </h2>

      {/* Hidden ID (for update) */}
      {data?.id && <input type="hidden" name="id" value={data.id} />}

      {/* Title */}
      <input
        type="text"
        name="title"
        defaultValue={data?.title}
        placeholder="Title"
        className="border p-2 rounded"
        required
      />

      {/* Start Date */}
      <input
        type="datetime-local"
        name="startDate"
        defaultValue={
          data?.startDate
            ? new Date(data.startDate).toISOString().slice(0, 16)
            : ""
        }
        className="border p-2 rounded"
        required
      />

      {/* Due Date */}
      <input
        type="datetime-local"
        name="dueDate"
        defaultValue={
          data?.dueDate
            ? new Date(data.dueDate).toISOString().slice(0, 16)
            : ""
        }
        className="border p-2 rounded"
        required
      />

      {/* 🔥 Lesson Dropdown */}
      <select
        name="lessonId"
        defaultValue={data?.lessonId || ""}
        className="border p-2 rounded"
        required
      >
        <option value="">Select Lesson</option>

        {lessons.length > 0 ? (
          lessons.map((lesson: any) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.subject?.name || "Subject"} -{" "}
              {lesson.class?.name || "Class"}
            </option>
          ))
        ) : (
          <option disabled>Loading lessons...</option>
        )}
      </select>

      {/* Submit */}
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AssignmentForm;