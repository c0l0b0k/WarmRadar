import React from "react";
import FileUpload from "./components/FileUpload";

function App() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
        WarmRadar – Классификация материалов
      </h1>
      <FileUpload />
    </main>
  );
}

export default App;
