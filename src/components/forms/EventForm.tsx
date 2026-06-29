"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { createEvent, updateEvent } from "@/lib/actions";

const EventForm = ({ type, data, setOpen, relatedData }: any) => {
  const action = type === "create" ? createEvent : updateEvent;

  const [state, formAction] = useFormState(action, {
    success: false,
    error: false,
  });

  useEffect(() => {
    if (state.success) {
      toast(`Event ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
    }
  }, [state, type, setOpen]);

  const { classes } = relatedData || {};

  return (
    <form action={formAction} className="flex flex-col gap-4 p-4 w-full max-w-md bg-white">
      <div>
        <h2 className="text-xl font-bold text-gray-800">
          {type === "create" ? "Create Event" : "Update Event"}
        </h2>
      </div>

      {data?.id && <input type="hidden" name="id" value={data.id} />}

      {/* EVENT TITLE */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Title</label>
        <input
          type="text"
          name="title"
          defaultValue={data?.title}
          placeholder="Event Title"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 shadow-sm"
          required
        />
      </div>

      {/* DESCRIPTION */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
        <textarea
          name="description"
          defaultValue={data?.description}
          placeholder="Description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none shadow-sm"
          required
        />
      </div>

      {/* TIMING GRID */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Starts At</label>
          <input
            type="datetime-local"
            name="startTime"
            defaultValue={
              data?.startTime
                ? new Date(data.startTime).toISOString().slice(0, 16)
                : ""
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ends At</label>
          <input
            type="datetime-local"
            name="endTime"
            defaultValue={
              data?.endTime
                ? new Date(data.endTime).toISOString().slice(0, 16)
                : ""
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm"
            required
          />
        </div>
      </div>

      {/* TARGET CLASS SELECTION */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</label>
        <select 
          name="classId" 
          defaultValue={data?.classId || ""}
          className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
        >
          <option value="">All Classes</option>
          {classes?.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* SUBMIT */}
      <button 
        type="submit"
        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition text-sm cursor-pointer shadow-sm active:scale-[0.99]"
      >
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default EventForm;