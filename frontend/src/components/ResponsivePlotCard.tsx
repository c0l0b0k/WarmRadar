

import Plot from "react-plotly.js";
import { useDscPlot } from "../hooks/useDscPlot";
import { useCallback, useEffect, useRef, useState } from "react";
import { Buffer } from "buffer";
import { fetchMainLinesByPoints } from "../api/dsc";


const TRACE_ID_POINTS = "points"; // Может передавать через параметр, а не задавать через константу?
const TRACE_ID_DSC_SMOOTH = "dsc_smooth"
const TRACE_ID_MAIN_LINES = "main_lines"


const defaultParams = {
  smooth_poly: 3,
  show_raw: true,
  show_smooth: true,
  show_deriv1: true,
  show_deriv2: true,
  show_points: true,
  show_segments: false,
  show_main_lines: true,
  show_main_areas:true,
  show_tga: true,
  show_d1_tga: true,
  show_d2_tga: true,
};

const download = (filename: string, text: string) => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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



export default function ResponsivePlotCard({ pk }: { pk: number }) {

  const [smoothWindow, setSmoothWindow] = useState(10);
  const params = { ...defaultParams, pk, smooth_window: smoothWindow };
  const { data, loading, error } = useDscPlot(params);

  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  type PolyPoint = { x: number; y: number };
  type MainLine = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    area: number;
    polyline: PolyPoint[];
  };

  const [mainLines, setMainLines] = useState<MainLine[]>([]);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const draggingIndexRef = useRef<number | null>(null);

  const [editableX, setEditableX] = useState<string[]>([]);
  const [editableSmoothWindow, setEditableSmoothWindow] = useState("10");

  const [newLineIdx1, setNewLineIdx1] = useState(0);
  const [newLineIdx2, setNewLineIdx2] = useState(1);


  const exportPointsCsv = () => {
    const header = "x,y\n";
    const rows   = points.map(p => `${p.x},${p.y}`).join("\n");
    download("points.csv", header + rows);
  };

  const exportAreasCsv = () => {
    const header = "x1,y1,x2,y2,area\n";
    const rows   = mainLines
      .map(l => `${l.x1},${l.y1},${l.x2},${l.y2},${l.area}`)
      .join("\n");
    download("areas.csv", header + rows);
  };


  const fetchMainLines = async () => {
    try {
      const lines = await fetchMainLinesByPoints(pk, points);
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
    const ptTrace = data?.data?.find(t => t.meta?.id === TRACE_ID_POINTS);
    if (!ptTrace) return;

    const xs = unpackArray(ptTrace.x);
    const ys = unpackArray(ptTrace.y);
    const pts = xs.map((x, i) => ({ x, y: ys[i] }));
    setPoints(pts);                          // ставим точки

    // — Запрашиваем линии и площади —
    fetchMainLinesByPoints(pk, pts)
      .then(setMainLines)
      .catch(err => console.error("❌ fetchMainLines", err));
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


  //   const modifiedData = (data?.data?.map((trace) => {
  // if (trace.meta?.id === TRACE_ID_POINTS) {
  //   return {
  //     ...trace,
  //     x: points.map((p) => p.x),
  //     y: points.map((p) => p.y),
  //     text: points.map((_, i) => `P${i + 1}`),
  //   };
  // }
  //
  // if (trace.meta?.id === TRACE_ID_MAIN_LINES) {
  //   const x: (number | null)[] = [];
  //   const y: (number | null)[] = [];
  //   for (const line of mainLines) {
  //     x.push(line.x1, line.x2, null);
  //     y.push(line.y1, line.y2, null);
  //   }
  //
  //   return {
  //     ...trace,
  //     x,
  //     y,
  //   };
  // }
  //
  // return trace;
  // }) ?? []);


  /* ---------- 1. базовые trace-ы (точки, линии) ---------- */
const baseTraces = (data?.data?.map((trace) => {
  if (trace.meta?.id === TRACE_ID_POINTS) {
    return {
      ...trace,
      x   : points.map(p => p.x),
      y   : points.map(p => p.y),
      text: points.map((_, i) => `P${i + 1}`),
    };
  }

  if (trace.meta?.id === TRACE_ID_MAIN_LINES) {
    const xs:(number|null)[] = [], ys:(number|null)[] = [];
    for (const l of mainLines) {
      xs.push(l.x1, l.x2, null);
      ys.push(l.y1, l.y2, null);
    }
    return { ...trace, x: xs, y: ys };
  }

  return trace;
}) ?? []);


  /* ---------- 2. добавляем ОДИН полигон с заливкой ---------- */
  if (defaultParams.show_main_areas && mainLines.length) {
    const X:(number|null)[] = [];
    const Y:(number|null)[] = [];

    for (const l of mainLines) {
      if (!l.polyline?.length) continue;
      const px = l.polyline.map(p => p.x);
      const py = l.polyline.map(p => p.y);

      // замкнуть + None для разрыва
      X.push(...px, px[0], null);
      Y.push(...py, py[0], null);
    }

    baseTraces.push({
      type : "scatter",
      x    : X,
      y    : Y,
      mode : "lines",
      fill : "toself",
      line : { width: 0 },
      name : "Область",          // один пункт легенды
      fillcolor: "rgba(255, 165, 0, 0.2)",
      yaxis: "y",
      meta : { id: "main_area" },
      showlegend: true,
    });
  }

  /* ---------- 3. итоговый массив для Plotly ---------- */
  const modifiedData = baseTraces;

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


              {/* === панель управления графиком === */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <button
                    className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={fetchMainLines}
                >
                  🔄 Пересчитать линии
                </button>

                <div className="flex items-center gap-2">
                  <label htmlFor="smoothWindow" className="font-medium">
                    Коэффициент сглаживания
                  </label>
                  <input
                      id="smoothWindow"
                      type="number"
                      min={4}
                      max={25}
                      step={1}
                      value={editableSmoothWindow}
                      onChange={(e) => setEditableSmoothWindow(e.target.value)}
                      onBlur={() => {
                        const p = parseInt(editableSmoothWindow);
                        if (!isNaN(p)) setSmoothWindow(Math.min(25, Math.max(4, p)));
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      className="w-20 border rounded px-2 py-1 text-center"
                  />
                </div>

                  <button
                      onClick={exportPointsCsv}
                      className="px-4 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  >
                    ⬇️ Скачать точки CSV
                  </button>

                  <button
                      onClick={exportAreasCsv}
                      className="px-4 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  >
                    ⬇️ Скачать области CSV
                  </button>
                </div>



              {/* === блок таблиц === */}
              <div className="mt-8 flex flex-col lg:flex-row gap-8">

                {/* ——— таблица точек ——— */}
                <div className="flex-1">
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


                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-2">📏 Главные линии</h2>
                  <table className="w-full border text-sm">
                    <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1">#</th>
                      <th className="border px-2 py-1">Начало (P)</th>
                      <th className="border px-2 py-1">Конец (P)</th>
                      <th className="border px-2 py-1">Длина</th>
                      <th className="border px-2 py-1">Площадь</th>
                      <th className="border px-2 py-1">Удалить</th>
                    </tr>
                    </thead>
                    <tbody>
                    {mainLines.map((line, idx) => {
                      const length = Math.sqrt(
                          Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2)
                      );

                      const findIndexByCoord = (x: number, y: number): number => {
                        let minIndex = -1;
                        let minDist = Infinity;
                        for (let i = 0; i < points.length; i++) {
                          const px = points[i].x;
                          const py = points[i].y;
                          const dx = Math.abs(px - x);
                          const dy = Math.abs(py - y);
                          const dist = dx + dy;
                          console.log(`🔎 Сравниваем с P${i + 1}:`, {px, py, x, y, dx, dy, dist});
                          // Жёсткое условие для фильтра, чтобы не брать совсем не те точки
                          if (dx < 1 && dy < 0.2 && dist < minDist) {
                            minDist = dist;
                            minIndex = i;
                          }
                        }
                        if (minIndex === -1) {
                          console.warn("❌ Не удалось найти точку, ближайшую к:", {x, y});
                        }
                        return minIndex;
                      };

                      const idx1 = findIndexByCoord(line.x1, line.y1);
                      const idx2 = findIndexByCoord(line.x2, line.y2);
                      console.log(idx1, idx2)

                      return (
                          <tr key={idx}>
                            <td className="border px-2 py-1">{idx + 1}</td>
                            <td className="border px-2 py-1">{idx1 >= 0 ? `P${idx1 + 1}` : "-"}</td>
                            <td className="border px-2 py-1">{idx2 >= 0 ? `P${idx2 + 1}` : "-"}</td>
                            <td className="border px-2 py-1 text-center">{length.toFixed(2)}</td>
                            <td className="border px-2 py-1 text-center">{line.area.toFixed(2)}</td>
                            <td className="border px-2 py-1 text-center">
                              <button
                                  onClick={() =>
                                      setMainLines((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="text-red-600 font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                      );
                    })}
                    </tbody>
                  </table>

                  {/*<div className="mt-4 flex items-center gap-4">*/}
                  {/*  <div>*/}
                  {/*    <label className="block text-sm">Точка 1:</label>*/}
                  {/*    <select*/}
                  {/*        value={newLineIdx1}*/}
                  {/*        onChange={(e) => setNewLineIdx1(Number(e.target.value))}*/}
                  {/*        className="border px-2 py-1 text-sm"*/}
                  {/*    >*/}
                  {/*      {points.map((_, idx) => (*/}
                  {/*          <option key={idx} value={idx}>*/}
                  {/*            P{idx + 1}*/}
                  {/*          </option>*/}
                  {/*      ))}*/}
                  {/*    </select>*/}
                  {/*  </div>*/}

                  {/*  <div>*/}
                  {/*    <label className="block text-sm">Точка 2:</label>*/}
                  {/*    <select*/}
                  {/*        value={newLineIdx2}*/}
                  {/*        onChange={(e) => setNewLineIdx2(Number(e.target.value))}*/}
                  {/*        className="border px-2 py-1 text-sm"*/}
                  {/*    >*/}
                  {/*      {points.map((_, idx) => (*/}
                  {/*          <option key={idx} value={idx}>*/}
                  {/*            P{idx + 1}*/}
                  {/*          </option>*/}
                  {/*      ))}*/}
                  {/*    </select>*/}
                  {/*  </div>*/}

                  {/*  <button*/}
                  {/*      onClick={() => {*/}
                  {/*        if (newLineIdx1 === newLineIdx2) return;*/}
                  {/*        const p1 = points[newLineIdx1];*/}
                  {/*        const p2 = points[newLineIdx2];*/}
                  {/*        setMainLines((prev) => [*/}
                  {/*          ...prev,*/}
                  {/*          {*/}
                  {/*            x1: p1.x,*/}
                  {/*            y1: p1.y,*/}
                  {/*            x2: p2.x,*/}
                  {/*            y2: p2.y,*/}
                  {/*          },*/}
                  {/*        ]);*/}
                  {/*      }}*/}
                  {/*      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"*/}
                  {/*  >*/}
                  {/*    ➕ Добавить линию*/}
                  {/*  </button>*/}
                  {/*</div>*/}
                </div>
              </div>

            </>
        )}
      </div>
    </div>
  );
}
