"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full hover:bg-slate-100 focus:outline-none"
      >
        <SettingsIcon className="w-5 h-5 text-slate-700" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <Link href="/yui/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">設定</Link>
            <Link href="/settings/account" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">外部連携</Link>
          </div>
        </div>
      )}
    </div>
  );
}
