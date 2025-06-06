type Tab = "dsc" | "cls" | "rep";

export function Tabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const btn = (id: Tab, label: string) => (
    <button
      onClick={() => onChange(id)}
      className={
        "flex-1 px-4 py-1 border" +
        (active === id ? " bg-gray-200 font-semibold" : "")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex w-full max-w-md mx-auto mb-4">
      {btn("dsc", "ДСК Анализ")}
      {btn("cls", "Классификация")}
      {btn("rep", "Отчёт")}
    </div>
  );
}