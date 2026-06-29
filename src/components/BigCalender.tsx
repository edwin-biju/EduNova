"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

const localizer = momentLocalizer(moment);

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
};

type Props = {
  events: CalendarEvent[];
};

const BigCalendar = ({ events }: Props) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  return (
    <>
      <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-header {
          padding: 10px 0;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          border-bottom: 1px solid #f3f4f6;
          background: #fafafa;
        }
        .rbc-time-view, .rbc-month-view { border: none; }
        .rbc-time-content { border-top: 1px solid #f3f4f6; }
        .rbc-timeslot-group { border-bottom: 1px solid #f9fafb; min-height: 60px; }
        .rbc-time-slot { color: #9ca3af; font-size: 0.7rem; }
        .rbc-current-time-indicator { background: #3b82f6; height: 2px; }
        .rbc-today { background-color: #eff6ff; }
        .rbc-off-range-bg { background: #f9fafb; }
        .rbc-event {
          background: #3b82f6;
          border: none !important;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 0.75rem;
          font-weight: 500;
          box-shadow: 0 1px 3px rgba(59,130,246,0.3);
        }
        .rbc-event:nth-child(odd) { background: #8b5cf6; box-shadow: 0 1px 3px rgba(139,92,246,0.3); }
        .rbc-event.rbc-selected { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3b82f6; }
        .rbc-toolbar {
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rbc-toolbar button {
          border: 1px solid #e5e7eb;
          background: white;
          color: #374151;
          border-radius: 8px;
          padding: 5px 14px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .rbc-toolbar button:hover { background: #f3f4f6; }
        .rbc-toolbar button.rbc-active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .rbc-toolbar .rbc-toolbar-label {
          font-weight: 600;
          font-size: 0.95rem;
          color: #111827;
        }
        .rbc-time-header-content { border-left: 1px solid #f3f4f6; }
        .rbc-day-slot .rbc-time-slot { border-top: 1px solid #f9fafb; }
        .rbc-time-gutter .rbc-timeslot-group { border-bottom: 1px solid #f9fafb; }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["work_week", "day"]}
        view={view}
        style={{ height: "calc(100vh - 200px)" }}
        onView={setView}
        min={new Date(1970, 0, 1, 8, 0, 0)}
        max={new Date(1970, 0, 1, 17, 0, 0)}
      />
    </>
  );
};

export default BigCalendar;