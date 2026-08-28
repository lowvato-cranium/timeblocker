import { api } from "../../api/client";
import type { TimerSettings } from "./types";

export const timerApi = {
  getSettings: () => api.get<{ settings: TimerSettings }>("/timer/settings").then((r) => r.settings),
  updateSettings: (settings: TimerSettings) =>
    api.put<{ settings: TimerSettings }>("/timer/settings", settings).then((r) => r.settings),
};
