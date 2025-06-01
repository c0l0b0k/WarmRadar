import Plot from "react-plotly.js";
import { useDscPlot } from "../hooks/useDscPlot";

const defaultParams = {
  pk: 14,
  smooth_window: 11,
  smooth_poly: 3,
  show_raw: false,
  show_smooth: true,
  show_deriv1: true,
  show_deriv2: true,
  show_points: true,
  show_segments: true,
  show_tga: true,
  show_d1_tga: true,
  show_d2_tga: true,
};

export default function ResponsivePlotCard() {
  const { data, loading, error } = useDscPlot(defaultParams);

  return (
    <div className="p-2 sm:p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">📊 DSC Анализ</h1>

      {/*<div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">*/}
      {/*  /!* Чекбоксы или элементы управления можно вставить сюда *!/*/}
      {/*  <div className="flex items-center gap-2">*/}
      {/*    <input type="checkbox" defaultChecked />*/}
      {/*    <label className="text-sm">Показывать сглаживание</label>*/}
      {/*  </div>*/}
      {/*  <div className="flex items-center gap-2">*/}
      {/*    <input type="checkbox" defaultChecked />*/}
      {/*    <label className="text-sm">Показывать 2-ю производную</label>*/}
      {/*  </div>*/}
      {/*</div>*/}

      <div className="bg-white shadow-md rounded-lg p-2 sm:p-4">
        {loading && <p className="text-gray-500">Загрузка графика...</p>}
        {error && <p className="text-red-500">Ошибка: {error}</p>}
        {data && (
          <Plot
            data={data.data}
            layout={{
              ...data.layout,
              autosize: true,
              margin: { l: 40, r: 20, t: 40, b: 40 },
            }}
            config={{ responsive: true }}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
            className="h-[60vh] sm:h-[70vh] md:h-[80vh]"
          />
        )}
      </div>
    </div>
  );
}
