import React, { useState } from "react";
import { uploadFile, classifyFile } from "../api/dsc";
import FileItem from "./FileItem";

export default function FileUpload() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setError(null);
      const uploaded = await uploadFile(file);
      setFiles((prev) => [...prev, uploaded]);
    } catch (err) {
      setError("Ошибка загрузки файла");
    }
  };

  const handleClassify = async (fileId) => {
    try {
      const result = await classifyFile(fileId);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, classification: result } : f
        )
      );
    } catch (err) {
      alert("Ошибка классификации");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <input
        type="file"
        accept=".txt"
        onChange={handleUpload}
        className="block w-full border p-2"
      />
      {error && <div className="text-red-600">{error}</div>}
      <ul className="space-y-2">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onClassify={() => handleClassify(file.id)}
          />
        ))}
      </ul>
    </div>
  );
}
