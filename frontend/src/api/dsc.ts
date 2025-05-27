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
