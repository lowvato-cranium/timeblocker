import { formatDateTime } from "../../shared/format";
import { STATUS_LABELS, type Task } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

interface Props {
  tasks: Task[];
}

export function RecentActivityPanel({ tasks }: Props) {
  const cutoff = Date.now() - DAY_MS;
  const recent = tasks.filter((t) => t.createdAt >= cutoff).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <section className="recent-activity-panel">
      <h2>Last 24 Hours</h2>
      {recent.length === 0 ? (
        <p className="muted">No tasks worked on in the last 24 hours.</p>
      ) : (
        <div className="recent-activity-table-wrap">
          <table className="recent-activity-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Started</th>
                <th>Status Changed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((task) => (
                <tr key={task.id}>
                  <td>{task.description}</td>
                  <td>{formatDateTime(task.createdAt)}</td>
                  <td>{formatDateTime(task.statusChangedAt)}</td>
                  <td>
                    <span className={`status-pill status-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
