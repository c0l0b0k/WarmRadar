import Plot from "react-plotly.js";
import { useDscPlot } from "../hooks/useDscPlot";

const defaultParams = {
  filename: "example.txt",
  smooth_window: 11,
  smooth_poly: 3,
  show_raw: true,
  show_smooth: true,
  show_deriv1: true,
  show_deriv2: true,
  show_points: true,
  show_segments: true,
};

export default function DscPlot() {
  const { data, loading, error } = useDscPlot(defaultParams);

  // if (loading) return <p className="text-gray-500 p-4">Загрузка графика...</p>;
  if (error) return <p className="text-red-500 p-4">Ошибка: {error}</p>;

  return (
      <div className="p-4 max-w-screen-xl mx-auto">
        <div className="bg-white shadow-md rounded p-2 sm:p-4">
          <Plot
              data={data.data}
              layout={data.layout}
              config={{responsive: true}}
              useResizeHandler={true}
              style={{width: "100%", height: "100%"}}
              className="h-[60vh] sm:h-[70vh] md:h-[80vh]"
          />
        </div>
      </div>
  );
}