import ClassifyResult from "../components/ClassifyResult";
import DscPlotEditor from "../components/DscPlotEditor";

export default function Analyze() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <ClassifyResult />
      <DscPlotEditor />
    </div>
  );
}
