"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { createResult, updateResult } from "@/lib/actions";

const ResultForm = ({ type, data, setOpen }: any) => {
  const action = type === "create" ? createResult : updateResult;

  const [state, formAction] = useFormState(action, {
    success: false,
    error: false,
  });

  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // 🔥 Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      const [s, e, a] = await Promise.all([
        fetch("/api/students").then(res => res.json()),
        fetch("/api/exams").then(res => res.json()),
        fetch("/api/assignments").then(res => res.json()),
      ]);

      setStudents(s);
      setExams(e);
      setAssignments(a);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (state.success) {
      toast.success("Result saved!");
      setOpen(false);
    }

    if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state, setOpen]);

  return (
    <form action={formAction} className="flex flex-col gap-4 p-4">

      <h2 className="text-lg font-semibold">
        {type === "create" ? "Create Result" : "Update Result"}
      </h2>

      {data?.id && <input type="hidden" name="id" value={data.id} />}

      {/* Student */}
      <select name="studentId" required className="border p-2 rounded">
        <option value="">Select Student</option>
        {students.map((s: any) => (
          <option key={s.id} value={s.id}>
            {s.name} {s.surname}
          </option>
        ))}
      </select>

      {/* Exam */}
      <select name="examId" className="border p-2 rounded">
        <option value="">Select Exam</option>
        {exams.map((e: any) => (
          <option key={e.id} value={e.id}>
            {e.title}
          </option>
        ))}
      </select>

      {/* Assignment */}
      <select name="assignmentId" className="border p-2 rounded">
        <option value="">Select Assignment</option>
        {assignments.map((a: any) => (
          <option key={a.id} value={a.id}>
            {a.title}
          </option>
        ))}
      </select>

      {/* Score */}
      <input
        type="number"
        name="score"
        defaultValue={data?.score}
        placeholder="Score"
        className="border p-2 rounded"
        required
      />

      <button className="bg-blue-500 text-white p-2 rounded">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ResultForm;