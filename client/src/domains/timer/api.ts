import { api } from "../../api/client";
import type { TimerSettings } from "./types";

export const timerApi = {
  getSettings: () => api.get<{ settings: TimerSettings }>("/timer/settings").then((r) => r.settings),
  updateSettings: (settings: TimerSettings) =>
    api.put<{ settings: TimerSettings }>("/timer/settings", settings).then((r) => r.settings),
  uploadSound: (file: File) => {
    const formData = new FormData();
    formData.append("sound", file);
    return api.upload<{ settings: TimerSettings }>("/timer/sound", formData).then((r) => r.settings);
  },
  removeSound: () => api.delete<{ settings: TimerSettings }>("/timer/sound").then((r) => r.settings),
};
