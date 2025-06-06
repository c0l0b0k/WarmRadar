// src/components/FileUpload.tsx
import { useState, DragEvent } from "react";
import { uploadFile } from "../api/dsc";

export default function FileUpload({
  onUploaded,
}: {
  onUploaded: (pk: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  /* ---------- общая функция загрузки ---------- */
  async function doUpload(file: File) {
    try {
      setBusy(true);
      const res = await uploadFile(file); // { id: ... }
      onUploaded(res.id);
    } catch {
      setErr("Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  /* ---------- drop handlers ---------- */
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);

    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(true);
  };

  const handleDragLeave = () => setDrag(false);

  /* ---------- click-upload ---------- */
  const handleChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    file && doUpload(file);
  };

  /* ---------- render ---------- */
  return (
    <div className="w-48 p-4 border rounded text-center">
      <p className="font-semibold mb-2">Загрузка .txt</p>

      <label
        className={
          "block h-28 border-2 rounded cursor-pointer transition " +
          (drag
            ? "border-blue-600 bg-blue-50"
            : "border-dashed hover:border-gray-400")
        }
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {busy ? "..." : "Перетащите файл или нажмите"}
        <input
          type="file"
          accept=".txt"
          hidden
          onChange={handleChoose}
        />
      </label>

      {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
    </div>
  );
}
