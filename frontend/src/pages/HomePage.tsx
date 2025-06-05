import React from "react";
import FileUpload  from "../components/FileUpload";

export const HomePage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-8">🔬 WarmRadar</h1>
      <FileUpload/>
    </main>
  );
};