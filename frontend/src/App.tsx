//import React from "react";
import FileUpload from "./components/FileUpload";
import DscPlot from "./components/DscPlot";
import ResponsivePlotCard from "./components/ResponsivePlotCard";

import AppRouter from "./router";
import "./App.css";

function App() {
  return (
    <div className="font-sans text-gray-800">
      <AppRouter />
    </div>
  );
}

export default App;

