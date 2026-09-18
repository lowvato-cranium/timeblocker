import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDateTime, formatDuration, formatTime, toDateInputValue } from "../../shared/format";
import { tasksApi } from "./api";
import { STATUS_LABELS, TASK_STATUSES, type Task, type TaskSession } from "./types";

const columnHelper = createColumnHelper<Task>();

const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("description", { header: "Description" }),
  columnHelper.accessor("notes", { header: "Notes" }),
  columnHelper.accessor("status", {
    header: "Status",
    filterFn: "equalsString",
    cell: (info) => STATUS_LABELS[info.getValue()],
  }),
  columnHelper.accessor((row) => (row.active ? "Yes" : "No"), {
    id: "active",
    header: "Active",
    filterFn: "equalsString",
  }),
  columnHelper.accessor("createdAt", {
    header: "Started At",
    cell: (info) => formatDateTime(info.getValue()),
  }),
  columnHelper.accessor("statusChangedAt", {
    header: "Status Changed At",
    cell: (info) => formatDateTime(info.getValue()),
  }),
  columnHelper.accessor((row) => row.labels.map((label) => `${label.key}:${label.value}`).join(", "), {
    id: "labels",
    header: "Labels",
  }),
  columnHelper.accessor(
    (row) =>
      row.sessions
        .map((s) => `${formatDateTime(s.startedAt)}–${s.endedAt ? formatDateTime(s.endedAt) : "ongoing"}`)
        .join(", "),
    { id: "sessions", header: "Sessions" }
  ),
];

function ColumnFilter({ column }: { column: Column<Task, unknown> }) {
  if (column.id === "status") {
    return (
      <select
        value={(column.getFilterValue() as string) ?? ""}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      >
        <option value="">All</option>
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      value={(column.getFilterValue() as string) ?? ""}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      placeholder="Filter..."
    />
  );
}

interface SessionRow {
  session: TaskSession;
  task: Task;
}

// A day's sessions, oldest first, joined back to their owning task —
// the unit the Daily Log reports on is the session, not the task.
function sessionsForDay(tasks: Task[], dateStr: string): SessionRow[] {
  const dayStart = new Date(`${dateStr}T00:00:00`).getTime();
  const dayEnd = new Date(`${dateStr}T23:59:59.999`).getTime();
  const rows: SessionRow[] = [];
  for (const task of tasks) {
    for (const session of task.sessions) {
      if (session.startedAt >= dayStart && session.startedAt <= dayEnd) {
        rows.push({ session, task });
      }
    }
  }
  return rows.sort((a, b) => a.session.startedAt - b.session.startedAt);
}

function DailyLogView({ tasks }: { tasks: Task[] }) {
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const rows = useMemo(() => sessionsForDay(tasks, date), [tasks, date]);
  const totalMs = useMemo(() => {
    const now = Date.now();
    return rows.reduce((sum, { session }) => sum + ((session.endedAt ?? now) - session.startedAt), 0);
  }, [rows]);

  return (
    <div className="daily-log">
      <div className="reports-toolbar">
        <label>
          Day
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button type="button" onClick={() => setDate(toDateInputValue(new Date()))}>
          Today
        </button>
      </div>

      <div className="reports-table-wrap">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
              <th>Task</th>
              <th>Status</th>
              <th>Labels</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ session, task }) => (
              <tr key={session.id}>
                <td>{formatTime(session.startedAt)}</td>
                <td>{session.endedAt ? formatTime(session.endedAt) : "ongoing"}</td>
                <td>{formatDuration((session.endedAt ?? Date.now()) - session.startedAt)}</td>
                <td>{task.description}</td>
                <td>{STATUS_LABELS[task.status]}</td>
                <td>{task.labels.map((l) => `${l.key}:${l.value}`).join(", ")}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No sessions on this day.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <p className="daily-log-total">
          Total: {formatDuration(totalMs)} across {rows.length} session{rows.length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

export function ReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"daily" | "tasks">("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    tasksApi
      .list()
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  const dateFilteredTasks = useMemo(() => {
    const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toMs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;
    return tasks.filter((task) => {
      if (fromMs !== null && task.createdAt < fromMs) return false;
      if (toMs !== null && task.createdAt > toMs) return false;
      return true;
    });
  }, [tasks, fromDate, toDate]);

  const table = useReactTable({
    data: dateFilteredTasks,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="reports-page">
      <header className="app-header">
        <h1>timeBlocker</h1>
        <Link className="back-link" to="/">
          ← Back to timer
        </Link>
      </header>

      <div className="reports-body">
        <div className="reports-view-toggle">
          <button
            type="button"
            className={view === "daily" ? "active" : ""}
            onClick={() => setView("daily")}
          >
            Daily Log
          </button>
          <button
            type="button"
            className={view === "tasks" ? "active" : ""}
            onClick={() => setView("tasks")}
          >
            Task Table
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : view === "daily" ? (
          <DailyLogView tasks={tasks} />
        ) : (
          <>
            <h2>Task Report</h2>

            <div className="reports-toolbar">
              <label>
                From
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </label>
              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear dates
                </button>
              )}
            </div>

            <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>
                        <button
                          type="button"
                          className="reports-sort-btn"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" && " ▲"}
                          {header.column.getIsSorted() === "desc" && " ▼"}
                        </button>
                        {header.column.getCanFilter() && <ColumnFilter column={header.column} />}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="muted">
                      No tasks match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
