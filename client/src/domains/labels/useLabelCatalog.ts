import { useCallback, useEffect, useState } from "react";
import { labelsApi } from "./api";
import type { Label } from "./types";

export function useLabelCatalog() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => labelsApi.list().then(setLabels), []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return { labels, loading, refresh };
}
