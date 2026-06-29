"use client";

import { useState } from "react";
import FormContainer from "./FormContainer";

const AnnouncementTable = ({ data, role }: any) => {
  const [selected, setSelected] = useState<any>(null);

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b text-sm">
      <td className="p-4">{item.title}</td>
      <td>{item.class ? item.class.name : "All Classes"}</td>
      <td>{new Date(item.date).toLocaleDateString()}</td>

      <td>
        <div className="flex gap-2">
          {/* ✅ VIEW */}
          <button
            onClick={() => setSelected(item)}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            View
          </button>

          {role === "admin" && (
            <>
              <FormContainer table="announcement" type="update" data={item} />
              <FormContainer table="announcement" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <table className="w-full mt-4">
        <thead>
          <tr>
            <th>Title</th>
            <th>Class</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>{data.map(renderRow)}</tbody>
      </table>

      {/* 🔥 MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[400px] relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-2"
            >
              ✖
            </button>

            <h2 className="text-lg font-bold mb-2">{selected.title}</h2>

            <p className="text-sm">{selected.description}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementTable;