import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ProfileAvatar({
  src,
  name,
  editable = false,
  onPhotoChange,
}) {
  const [preview, setPreview] = useState(src || "");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    setPreview(src || "");
  }, [src]);

  const safeName = String(name || "Donor").trim() || "Donor";
  const initials = safeName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFile = (file) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    // 2MB limit — base64 localStorage-ku safe-ah irukkum.
    if (file.size > 2 * 1024 * 1024) {
      setError("Image 2MB-kulla irukkanum.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setPreview(dataUrl);
      onPhotoChange?.(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
    onPhotoChange?.("");
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-brand-500 bg-brand-100 dark:border-brand-400 dark:bg-brand-900/40 flex items-center justify-center">
        {preview ? (
          <img src={preview} alt={safeName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">
            {initials}
          </span>
        )}
      </div>
      {editable && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="absolute -bottom-1 -right-1 flex gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full bg-brand-600 p-2 text-white shadow-lg transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              aria-label="Change photo"
              title="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-full bg-slate-600 p-2 text-white shadow-lg transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                aria-label="Remove photo"
                title="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
