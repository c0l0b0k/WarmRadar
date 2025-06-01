import React from "react";

export default function FileItem({ file, onClassify }) {
  return (
    <li className="border p-4 rounded bg-white shadow">
      <div className="font-semibold">{file.original_filename}</div>
      {file.classification ? (
        <div className="mt-2 text-green-600 font-medium">
          Классифицировано: {file.classification.material} <span>Ошибка: {file.classification.error}</span>
        </div>
      ) : (
        <button
          onClick={onClassify}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Определить материал
        </button>
      )}
    </li>
  );
}