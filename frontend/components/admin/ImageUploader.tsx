"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string; // e.g. "image/*" or "image/*,video/*"
  maxSizeMB?: number;
  label?: string;
  className?: string;
  showUrlField?: boolean;
};

export default function ImageUploader({
  value,
  onChange,
  folder = "uploads",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSizeMB = 5,
  label = "Upload image",
  className = "",
  showUrlField = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File) => {
    // client-side validation
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSizeMB}MB.`);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      // 1) get signed URL
      const res = await fetch("/api/admin/uploads/signed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, folder, contentType: file.type }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Signed URL failed");
      const { signedUrl, publicUrl } = await res.json();

      // 2) upload via XHR to get progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed " + xhr.status)));
        xhr.onerror = () => reject(new Error("Upload error"));
        xhr.send(file);
      });

      onChange(publicUrl);
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onFile = (file: File | null) => {
    if (file) upload(file);
  };

  const isVideo = value && /\.(mp4|webm|mov|m4v)$/i.test(value);

  return (
    <div className={className}>
      {value ? (
        <div className="relative group border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 aspect-video max-w-xs">
          {isVideo ? (
            <video src={value} className="w-full h-full object-cover" muted playsInline />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt="" className="w-full h-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
            aria-label="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files?.[0] ?? null); }}
          className={`block cursor-pointer border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragging ? "border-gold bg-gold/5" : "border-neutral-300 hover:border-gold hover:bg-neutral-50"}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="w-5 h-5 animate-spin text-gold mx-auto" />
              <div className="text-xs text-neutral-500">Uploading… {progress}%</div>
              <div className="h-1 bg-neutral-200 rounded overflow-hidden">
                <div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <UploadCloud className="w-6 h-6 text-neutral-400" />
              <span className="text-xs font-medium text-navy">{label}</span>
              <span className="text-[10px] text-neutral-400">Drag &amp; drop or click • max {maxSizeMB}MB</span>
            </div>
          )}
        </label>
      )}
      {showUrlField && (
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="or paste URL…"
          className="mt-2 w-full text-xs bg-white rounded px-2 py-1.5 border border-neutral-200 outline-none focus:border-gold"
        />
      )}
    </div>
  );
}
