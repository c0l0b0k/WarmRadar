import { useState } from "react";

type Props = { onUploaded: (pk: number) => void };

export default function UploadFile({ onUploaded }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setBusy(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("http://localhost:8001/api/upload/", {
      method: "POST",
      body  : form,
    });

    const { pk } = await res.json(); // ← бэк должен вернуть { pk: 17 }
    onUploaded(pk);
    setBusy(false);
  }

  return (
    <div className="w-40 sm:w-48 p-4 border rounded text-center">
      <p className="font-semibold mb-2">Upload .txt</p>

      <label className="block border-2 border-dashed rounded h-28 flex items-center justify-center cursor-pointer">
        {busy ? "..." : "Choose File"}
        <input type="file" accept=".txt" onChange={handleFile} hidden />
      </label>

      {/* метаданные можно добавить позже */}
    </div>
  );
}