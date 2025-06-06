const API_URL = import.meta.env.VITE_API_URL;


/* -------- upload -------- */
export async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/upload/`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Ошибка при загрузке");

  return await res.json();           // { id: 40, ... }
}

export async function classifyFile(fileId) {
  const response = await fetch(`${API_URL}/file/${fileId}/classify/`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Ошибка при классификации");
  return await response.json();
}


export async function getPlot(params: object) {
  const res = await fetch(`${API_URL}/plot/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Ошибка при получении графика");
  return await res.json();
}

interface MainLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  area: number;
  polyline: { x: number; y: number }[];
}

export async function fetchMainLinesByPoints(
  pk: number,
  points: { x: number; y: number }[]
): Promise<MainLine[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/segments/by-points/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pk, points }),
  });

  if (!res.ok) {
    throw new Error(`Ошибка запроса: ${res.status}`);
  }

  return await res.json();
}