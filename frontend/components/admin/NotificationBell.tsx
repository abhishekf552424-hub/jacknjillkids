"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ShoppingBag, AlertTriangle, LifeBuoy, MessageSquare } from "lucide-react";

type Notification = { id: string; type: string; message: string; href: string; created_at: string };

const ICONS: Record<string, any> = {
  order: ShoppingBag,
  stock: AlertTriangle,
  support: LifeBuoy,
  review: MessageSquare,
};

const LAST_SEEN_KEY = "jj_admin_notifications_last_seen";

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const j = await res.json();
      const list: Notification[] = j.notifications ?? [];
      setItems(list);
      const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) ?? 0);
      setUnread(list.filter((n) => new Date(n.created_at).getTime() > lastSeen).length);
    } catch {
      // silent — notifications are non-critical, never block the admin UI
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s while an admin page is open
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) {
      localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
      setUnread(0);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-navy/5 text-navy"
        data-testid="admin-notification-bell"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-premium border border-navy/5 z-50">
          <div className="px-4 py-3 border-b border-navy/5">
            <p className="text-sm font-semibold text-navy">Notifications</p>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Nothing new right now.</p>
          ) : (
            <ul className="divide-y divide-navy/5">
              {items.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                return (
                  <li key={n.id}>
                    <Link href={n.href} className="flex items-start gap-3 px-4 py-3 hover:bg-cream/60 transition-colors" onClick={() => setOpen(false)}>
                      <Icon className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-navy truncate">{n.message}</p>
                        <p className="text-[11px] text-muted">{new Date(n.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
