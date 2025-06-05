const API_URL = import.meta.env.VITE_API_URL;


export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Ошибка при загрузке файла");
  return await response.json();
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

export interface MainLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
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