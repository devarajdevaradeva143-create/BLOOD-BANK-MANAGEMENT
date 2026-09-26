import { Camera, X } from "lucide-react";
import { useState } from "react";

export default function ProfileAvatar({ src, name, editable = false, onPhotoChange }) {
  const [hasPhoto, setHasPhoto] = useState(Boolean(src));
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase();
  return (
    <div className="relative inline-flex">
      <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-brand-500 bg-brand-100 dark:border-brand-400 dark:bg-brand-900/40 flex items-center justify-center">
        {hasPhoto ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">{initials}</span>
        )}
      </div>
      {editable && (
        <button type="button" onClick={() => setHasPhoto(!hasPhoto)} className="absolute -bottom-1 -right-1 rounded-full bg-brand-600 p-2 text-white shadow-lg transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950" aria-label={hasPhoto ? "Remove photo" : "Change photo"}>
          {hasPhoto ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
