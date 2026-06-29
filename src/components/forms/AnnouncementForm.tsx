"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";

const AnnouncementForm = ({ type, data, setOpen }: any) => {
  const action =
    type === "create" ? createAnnouncement : updateAnnouncement;

  const [state, formAction] = useFormState(action, {
    success: false,
    error: false,
  });

  const [classes, setClasses] = useState([]);

  // 🔥 fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data);
    };

    fetchClasses();
  }, []);

  // ✅ success / error
  useEffect(() => {
    if (state.success) {
      toast.success(
        type === "create"
          ? "Announcement created!"
          : "Announcement updated!"
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
        {type === "create" ? "Create Announcement" : "Update Announcement"}
      </h2>

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

      {/* Description */}
      <textarea
        name="description"
        defaultValue={data?.description}
        placeholder="Description"
        className="border p-2 rounded"
        required
      />

      {/* Date */}
      <input
        type="date"
        name="date"
        defaultValue={
          data?.date ? new Date(data.date).toISOString().split("T")[0] : ""
        }
        className="border p-2 rounded"
        required
      />

      {/* Class dropdown */}
      <select
        name="classId"
        defaultValue={data?.classId || ""}
        className="border p-2 rounded"
      >
        <option value="">All Classes</option>

        {classes.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button className="bg-blue-500 text-white p-2 rounded">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AnnouncementForm;