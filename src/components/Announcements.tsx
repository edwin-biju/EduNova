"use client";

import { useEffect, useState } from "react";

const Announcements = () => {
  const [data, setData] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  // 🔥 Fetch announcements from API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setData(data.slice(0, 3)); // take top 3
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="bg-white p-4 rounded-md">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-gray-400">View All</span>
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-4 mt-4">
        {data.map((item, index) => (
          <div
            key={item.id}
            className={`rounded-md p-4 ${
              index === 0
                ? "bg-lamaSkyLight"
                : index === 1
                ? "bg-lamaPurpleLight"
                : "bg-lamaYellowLight"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{item.title}</h2>

              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(
                  new Date(item.date)
                )}
              </span>
            </div>

            {/* 🔥 Preview (short) */}
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {item.description}
            </p>

            {/* 🔥 View Button */}
            <button
              onClick={() => setSelected(item)}
              className="text-blue-500 text-xs mt-2"
            >
              Read more
            </button>
          </div>
        ))}
      </div>

      {/* 🔥 MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] md:w-[500px] relative">
            
            {/* CLOSE */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3"
            >
              ✖
            </button>

            {/* CONTENT */}
            <h2 className="text-xl font-semibold mb-4">
              {selected.title}
            </h2>

            <p className="text-gray-700 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {selected.description}
            </p>

            <div className="mt-4 text-sm text-gray-500">
              {new Date(selected.date).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;