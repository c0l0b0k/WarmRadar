// src/components/Dashboard.tsx
import { useState } from "react";
import FileUpload from "./FileUpload";
import ResponsivePlotCard from "./ResponsivePlotCard";
import { Tabs } from "./Tabs";          // лёгкий таб-бар из ответа выше

export default function Dashboard() {
  const [pk , setPk ] = useState<number|null>(null);
  const [tab, setTab] = useState<"dsc"|"cls"|"rep">("dsc");

  return (
    <div className="p-4 flex flex-col gap-4">
      <Tabs active={tab} onChange={setTab} />

      <div className="flex gap-6">
        <FileUpload onUploaded={setPk} />

        <div className="flex-1">
          {tab === "dsc" && ( pk
            ? <ResponsivePlotCard pk={pk} />     // ← pk пробрасывается
            : <p className="text-gray-500 mt-6">Загрузите файл для анализа</p>
          )}

          {tab === "cls" && (
            <button className="border px-6 py-2 mt-10">🚧 Заглушка</button>
          )}

          {tab === "rep" && (
            <button className="border px-6 py-2 mt-10">🚧 Заглушка</button>
          )}
        </div>
      </div>
    </div>
  );
}
