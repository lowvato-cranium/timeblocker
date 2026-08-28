import { useCallback } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth, type AuthUser } from "./domains/auth/AuthContext";
import { LoginPage } from "./domains/auth/LoginPage";
import { useLabelCatalog } from "./domains/labels/useLabelCatalog";
import { RecentActivityPanel } from "./domains/tasks/RecentActivityPanel";
import { ReportsPage } from "./domains/tasks/ReportsPage";
import { TaskList } from "./domains/tasks/TaskList";
import { useTasks } from "./domains/tasks/useTasks";
import { TimerPanel } from "./domains/timer/TimerPanel";

// Only mounted once `user` is confirmed, so its data-fetching hooks
// (useTasks, TimerPanel's settings load) run after the session exists
// instead of racing the initial /auth/me check.
function AuthenticatedApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const { tasks, loading: tasksLoading, addTask, updateTask, removeTask, addLabel, removeLabel } = useTasks();
  const { labels: labelCatalog, refresh: refreshLabelCatalog } = useLabelCatalog();

  // Each timer phase (work or "other things") ending is a natural save
  // point: blur whatever field is focused so an in-progress notes edit
  // flushes to the server via its onBlur handler instead of being lost.
  const handleTimerEnd = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }, []);

  // Refresh the shared catalog after adding a label in case the picker's
  // "<new>" option just created one — every task's picker should see it.
  const handleAddLabel = useCallback(
    async (taskId: string, key: string, value: string) => {
      await addLabel(taskId, key, value);
      refreshLabelCatalog();
    },
    [addLabel, refreshLabelCatalog]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>timeBlocker</h1>
        <div className="app-header-user">
          <Link className="nav-link" to="/reports">
            Reports
          </Link>
          <span>{user.username}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>
      <main className="app-main">
        <TaskList
          tasks={tasks}
          loading={tasksLoading}
          labelCatalog={labelCatalog}
          onUpdate={updateTask}
          onRemove={removeTask}
          onAddLabel={handleAddLabel}
          onRemoveLabel={removeLabel}
        />
        <TimerPanel onAddTask={addTask} onTimerEnd={handleTimerEnd} />
      </main>
      <RecentActivityPanel tasks={tasks} />
    </div>
  );
}

function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div className="center-screen">Loading...</div>;
  if (!user) return <LoginPage />;

  return <AuthenticatedApp user={user} onLogout={() => logout()} />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="center-screen">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <ReportsPage />
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
