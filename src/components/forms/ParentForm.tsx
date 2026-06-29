"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { createParent, updateParent } from "@/lib/actions";

interface FormState {
  success: boolean;
  error: boolean;
  message?: string;
}

const ParentForm = ({ type, data, setOpen }: any) => {
  const action = type === "create" ? createParent : updateParent;

  const [state, formAction] = useFormState<FormState, FormData>(action, {
    success: false,
    error: false,
    message: "", 
  });

  useEffect(() => {
    if (state.success) {
      toast.success(type === "create" ? "Parent created!" : "Parent updated!");
      setOpen(false);
    }
    if (state.error && state.message) {
      toast.error(state.message);
    } else if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state, type, setOpen]);

  return (
    <form action={formAction} className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold text-gray-800">
        {type === "create" ? "Create Parent" : "Update Parent"}
      </h2>

      {state.error && state.message && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-xs font-semibold animate-pulse">
          ⚠️ {state.message}
        </div>
      )}

      {data?.id && <input type="hidden" name="id" value={data.id} />}

      <div className="flex flex-col gap-4">
        {/* USERNAME */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Username</label>
          <input
            type="text"
            name="username"
            defaultValue={data?.username}
            placeholder="Username"
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        {/* FIRST & LAST NAME GRID */}
        <div className="grid grid-cols-2 gap-4">
          {/* FIRST NAME */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">First Name</label>
            <input
              type="text"
              name="name"
              defaultValue={data?.name}
              placeholder="First Name"
              onInput={(e) => {
                // 🚫 Real-time filter: Instantly blocks numbers and special symbols, allowing only text letters and spaces
                e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z\s]/g, "");
              }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* LAST NAME */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Last Name</label>
            <input
              type="text"
              name="surname"
              defaultValue={data?.surname}
              placeholder="Last Name"
              onInput={(e) => {
                // 🚫 Real-time filter: Instantly blocks numbers and special symbols, allowing only text letters and spaces
                e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z\s]/g, "");
              }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>
        </div>

        {/* PHONE */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Phone</label>
          <input
            type="tel"
            name="phone"
            defaultValue={data?.phone}
            placeholder="Phone Number"
            pattern="[0-9]*"
            maxLength={15} // Prevents infinitely long phone entry spams
            onInput={(e) => {
              // 🚫 Real-time filter: Instantly strips out letters and symbols, allowing only numbers
              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
            }}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        {/* ADDRESS */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Address</label>
          <input
            type="text"
            name="address"
            defaultValue={data?.address}
            placeholder="Address"
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        {/* PASSWORD */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Minimum 8 characters"
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            required={type === "create"}
          />
        </div>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-semibold text-sm transition mt-2">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ParentForm;