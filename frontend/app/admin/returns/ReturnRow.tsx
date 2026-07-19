"use client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export default function ReturnRow({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const act = async (action: "approved" | "rejected") => {
    const r = await fetch(`/api/admin/returns/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: action }) });
    if (!r.ok) return toast.error("Failed");
    toast.success(action === "approved" ? "Approved" : "Rejected");
    router.refresh();
  };
  if (status !== "requested" && status !== "pending") return <span className="text-xs text-neutral-400">Done</span>;
  return (
    <div className="flex justify-end gap-1">
      <button onClick={() => act("approved")} title="Approve" className="p-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={() => act("rejected")} title="Reject" className="p-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}
