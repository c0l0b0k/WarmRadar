

import Plot from "react-plotly.js";
import { useDscPlot } from "../hooks/useDscPlot";
import { useCallback, useEffect, useRef, useState } from "react";
import { Buffer } from "buffer";
import { fetchMainLinesByPoints } from "../api/dsc";


const TRACE_ID_POINTS = "points"; // Может передавать через параметр, а не задавать через константу?
const TRACE_ID_DSC_SMOOTH = "dsc_smooth"
const TRACE_ID_MAIN_LINES = "main_lines"


const defaultParams = {
  pk: 14,
  smooth_poly: 3,
  show_raw: true,
  show_smooth: true,
  show_deriv1: true,
  show_deriv2: true,
  show_points: true,
  show_segments: false,
  show_events_line: true,
  show_tga: true,
  show_d1_tga: true,
  show_d2_tga: true,
};

// 🔓 Распаковка бинарного массива в float[]
function unpackArray(obj: any): number[] {
  if (Array.isArray(obj)) return obj;
  if (obj?.bdata) {
    const buffer = Buffer.from(obj.bdata, "base64");
    const float64 = new Float64Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength / Float64Array.BYTES_PER_ELEMENT
    );
    return Array.from(float64);
  }
  return [];
}



export default function ResponsivePlotCard() {
    const [smoothWindow, setSmoothWindow] = useState(10);

    const params = {
        ...defaultParams,
        smooth_window: smoothWindow,
    };
  const { data, loading, error } = useDscPlot(params);

  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [mainLines, setMainLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const draggingIndexRef = useRef<number | null>(null);

  const [editableX, setEditableX] = useState<string[]>([]);
  const [editableSmoothWindow, setEditableSmoothWindow] = useState("10");



const fetchMainLines = async () => {
  try {
    const lines = await fetchMainLinesByPoints(defaultParams.pk, points);
    setMainLines(lines);
  } catch (err) {
    console.error("Не удалось получить главные линии:", err);
  }
};

  useEffect(() => {
  setEditableX(points.map(p => p.x.toFixed(4)));
  }, [points]);

  useEffect(() => {
  setEditableSmoothWindow(smoothWindow.toString());
  }, [smoothWindow]);


  useEffect(() => {
    const pointsTrace = data?.data?.find((trace) => trace.meta?.id === TRACE_ID_POINTS);
    if (pointsTrace?.x && pointsTrace?.y) {
      const xArr = unpackArray(pointsTrace.x);
      const yArr = unpackArray(pointsTrace.y);
      const newPoints = xArr.map((xVal, i) => ({
        x: xVal,
        y: yArr[i],
      }));
      setPoints(newPoints);
    }


    // Загрузка главных линий
  const mainLinesTrace = data?.data?.find(trace => trace.meta?.id === TRACE_ID_MAIN_LINES);
  if (mainLinesTrace?.x && mainLinesTrace?.y) {
    const xArr = unpackArray(mainLinesTrace.x);
    const yArr = unpackArray(mainLinesTrace.y);

    const newMainLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < xArr.length; i += 3) {
      if (xArr[i] != null && xArr[i + 1] != null && yArr[i] != null && yArr[i + 1] != null) {
        newMainLines.push({
          x1: xArr[i],
          y1: yArr[i],
          x2: xArr[i + 1],
          y2: yArr[i + 1],
        });
      }
    }

    setMainLines(newMainLines);
  }
  }, [data]);

  const handleMouseDown = useCallback(
    (event: any) => {
      const point = event.points?.[0];
      if (!point) return;

      const trace = data?.data?.[point.curveNumber];
      if (trace.meta?.id === TRACE_ID_POINTS) {
        setDraggingIndex(point.pointIndex);
        console.log("🎯 Start drag:", point.pointIndex);
      }
    },
    [data]
  );

  const handleMouseMove = useCallback(
    (event: any) => {
      if (draggingIndex === null || !data) return;
      const { xvals } = event;
      if (!xvals?.length) return;

      const targetX = xvals[0];

      const dscTrace = data.data.find((t) => t.meta?.id === TRACE_ID_DSC_SMOOTH);
      if (!dscTrace?.x || !dscTrace?.y) return;

      const xArr = unpackArray(dscTrace.x);
      const yArr = unpackArray(dscTrace.y);

      const dscCurve = xArr.map((x, i) => ({ x, y: yArr[i] }));
      const closest = dscCurve.reduce((acc, cur) =>
        Math.abs(cur.x - targetX) < Math.abs(acc.x - targetX) ? cur : acc
      );

      setPoints((prev) => {
        const updated = [...prev];
        updated[draggingIndex] = { x: closest.x, y: closest.y };
        return updated;
      });
    },
    [draggingIndex, data]
  );

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


    const modifiedData = (data?.data?.map((trace) => {
  if (trace.meta?.id === TRACE_ID_POINTS) {
    return {
      ...trace,
      x: points.map((p) => p.x),
      y: points.map((p) => p.y),
      text: points.map((_, i) => `P${i + 1}`),
    };
  }

  if (trace.meta?.id === TRACE_ID_MAIN_LINES) {
    const x: (number | null)[] = [];
    const y: (number | null)[] = [];
    for (const line of mainLines) {
      x.push(line.x1, line.x2, null);
      y.push(line.y1, line.y2, null);
    }

    return {
      ...trace,
      x,
      y,
    };
  }

  return trace;
  }) ?? []);


  return (
    <div className="p-2 sm:p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">📊 ДСК Анализ</h1>

      <div className="bg-white shadow-md rounded-lg p-2 sm:p-4">
        {/*{loading && <p className="text-gray-500">Загрузка графика...</p>}*/}
        {error && <p className="text-red-500">Ошибка: {error}</p>}
        {data && (
            <>
                <Plot
                    divId="plot-root"
                    data={modifiedData}
                    layout={{
                        ...data.layout,
                        autosize: true,
                        margin: {l: 40, r: 20, t: 40, b: 40},
                        dragmode: "draw",
                        editable: true,
                    }}
                    config={{responsive: true}}
                    useResizeHandler
                    style={{width: "100%"}}  // ⚠️ нет height!
                    className="h-[50vh] sm:h-[50vh] md:h-[50vh]"
                    onClick={handleMouseDown}
                    onHover={handleMouseMove}
                />


                <button
                    className="mt-2 px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={fetchMainLines}
                >
                    🔄 Пересчитать линии
                </button>


                <div className="max-w-xs mx-auto mb-6 text-center">
                    <label htmlFor="smoothWindow" className="block font-medium mb-1">
                        Коэффициент сглаживания
                    </label>
                    <input
                        id="smoothWindow"
                        type="number"
                        min={4}
                        max={25}
                        step={1}
                        value={editableSmoothWindow}
                        onChange={(e) => {
                            setEditableSmoothWindow(e.target.value);
                        }}
                        onBlur={() => {
                            const parsed = parseInt(editableSmoothWindow);
                            if (!isNaN(parsed)) {
                                const clamped = Math.min(25, Math.max(4, parsed));
                                setSmoothWindow(clamped);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        className="w-full border rounded px-2 py-1 text-center"
                    />
                </div>


                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">📝 Таблица точек</h2>
                    <table className="w-full border text-sm">
                        <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-2 py-1">#</th>
                            <th className="border px-2 py-1">X</th>
                            <th className="border px-2 py-1">Y (по кривой)</th>
                            <th className="border px-2 py-1">Удалить</th>
                        </tr>
                        </thead>
                        <tbody>
                        {points.map((pt, idx) => (
                            <tr key={idx}>
                                <td className="border px-2 py-1">{idx + 1}</td>
                                <td className="border px-2 py-1">
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        value={editableX[idx] ?? ""}
                                        step="0.1"
                                        className="w-full border px-1"
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setEditableX((prev) => {
                                                const updated = [...prev];
                                                updated[idx] = val;
                                                return updated;
                                            });
                                        }}
                                        onBlur={() => {
                                            const newX = parseFloat(editableX[idx]);
                                            if (isNaN(newX)) return;

                                            const dscTrace = data?.data.find(t => t.meta?.id === TRACE_ID_DSC_SMOOTH);
                                            if (!dscTrace) return;
                                            const xArr = unpackArray(dscTrace.x);
                                            const yArr = unpackArray(dscTrace.y);

                                            const closest = xArr.reduce((acc, cur, i) => {
                                                return Math.abs(cur - newX) < Math.abs(acc.x - newX)
                                                    ? {x: cur, y: yArr[i]}
                                                    : acc;
                                            }, {x: xArr[0], y: yArr[0]});

                                            setPoints((prev) => {
                                                const updated = [...prev];
                                                updated[idx] = closest;
                                                return updated;
                                            });
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                (e.target as HTMLInputElement).blur();
                                            }
                                        }}
                                    />
                                </td>
                                <td className="border px-2 py-1 text-center">{pt.y.toFixed(4)}</td>
                                <td className="border px-2 py-1 text-center">
                                    <button
                                        onClick={() => {
                                            setPoints((prev) => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="text-red-600 font-bold"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <button
                        className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => {
                            const dscTrace = data?.data.find(t => t.meta?.id === TRACE_ID_DSC_SMOOTH);
                            if (!dscTrace) return;
                            const xArr = unpackArray(dscTrace.x);
                            const yArr = unpackArray(dscTrace.y);
                            const newPoint = {
                                x: xArr[Math.floor(xArr.length / 2)],
                                y: yArr[Math.floor(yArr.length / 2)]
                            };
                            setPoints((prev) => [...prev, newPoint]);
                        }}
                    >
                        ➕ Добавить точку
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
}
