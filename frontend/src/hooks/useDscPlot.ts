import { useEffect, useState } from "react";
import { getPlot } from "../api/dsc";

export function useDscPlot(params: object) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  setLoading(true);
    setError(null);

    getPlot(params)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(params)]); // следим за параметрами

  return { data, loading, error };
}