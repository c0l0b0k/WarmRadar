import Plot from "react-plotly.js";
import { useCallback, useEffect, useRef, useState } from "react";

// Пример кривой DSC
const dscData = Array.from({ length: 500 }, (_, i) => {
  const x = (i / 499) * 10;
  const y = Math.sin(x);
  return { x, y };
});

const MovablePointsWithSnap = () => {
  const [points, setPoints] = useState([
    { x: 1, y: Math.sin(1) },
    { x: 5, y: Math.sin(5) },
    { x: 8, y: Math.sin(8) },
  ]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const draggingIndexRef = useRef<number | null>(null);

  const handleMouseDown = useCallback((event: any) => {
    const point = event.points?.[0];
    if (point?.curveNumber === 1) {
      setDraggingIndex(point.pointIndex);
      console.log("🎯 Start drag:", point.pointIndex);
    }
  }, []);



  const handleMouseMove = useCallback((event: any) => {
    if (draggingIndex === null) return;
    const { xvals } = event;
    if (!xvals?.length) return;

    const targetX = xvals[0];

    // Найдём ближайшую точку на кривой
    const closest = dscData.reduce((acc, cur) =>
      Math.abs(cur.x - targetX) < Math.abs(acc.x - targetX) ? cur : acc
    );

    setPoints((prev) => {
      const updated = [...prev];
      updated[draggingIndex] = { x: closest.x, y: closest.y };
      return updated;
    });
  }, [draggingIndex]);


  const handleMouseDownEndDrag = (event: MouseEvent) => {
  const plotDiv = document.getElementById("plot-root");
  if (plotDiv && !plotDiv.contains(event.target as Node)) {
    console.log("⬜ Клик вне графика Plotly");
  } else {
    console.log("🧠 Actual draggingIndex:", draggingIndexRef.current);
    if (draggingIndexRef.current != null) {
      setDraggingIndex(null);
      console.log("🛑 End drag");
    }
  }
  };

  useEffect(() => {
  draggingIndexRef.current = draggingIndex;
}, [draggingIndex]);

  useEffect(() => {
  document.addEventListener("mousedown", handleMouseDownEndDrag);
  return () => {
    document.removeEventListener("mousedown", handleMouseDownEndDrag);
  };
}, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">🔧 Перетаскивание с привязкой</h2>
        <Plot
          divId="plot-root"
          data={[
            {
              x: dscData.map((p) => p.x),
              y: dscData.map((p) => p.y),
              type: "scatter",
              mode: "lines",
              name: "DSC Кривая",
              line: { color: "blue" },
            },
            {
              x: points.map((p) => p.x),
              y: points.map((p) => p.y),
              type: "scatter",
              mode: "markers",
              marker: { color: "red", size: 10 },
              name: "Точки пользователя",
            },
          ]}
          layout={{
            title: "Snap-точки к кривой",
            dragmode: false,
            xaxis: { range: [0, 10] },
            yaxis: { range: [-1.5, 1.5] },
          }}
          config={{ scrollZoom: false, displayModeBar: false }}
          style={{ width: "100%", height: "60vh" }}
          onClick={handleMouseDown}
          onHover={handleMouseMove}
        />
    </div>
  );
};

export default MovablePointsWithSnap;
