"use client";
import { useState, Fragment } from "react";
import Link from "next/link";
import { Menu } from "@headlessui/react";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsMenu() {
  return (
    <div className="relative">
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className="p-2 rounded-full hover:bg-slate-100 focus:outline-none">
          <SettingsIcon className="w-5 h-5 text-slate-700" />
        </Menu.Button>

        <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/yui/settings"
                  className={`block px-4 py-2 text-sm text-slate-700 ${active ? 'bg-slate-100' : ''}`}
                >
                  接続
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/settings/ai"
                  className={`block px-4 py-2 text-sm text-slate-700 ${active ? 'bg-slate-100' : ''}`}
                >
                  AI設定
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/settings/notifications"
                  className={`block px-4 py-2 text-sm text-slate-700 ${active ? 'bg-slate-100' : ''}`}
                >
                  通知
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/settings/appearance"
                  className={`block px-4 py-2 text-sm text-slate-700 ${active ? 'bg-slate-100' : ''}`}
                >
                  テーマ
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/help"
                  className={`block px-4 py-2 text-sm text-slate-700 ${active ? 'bg-slate-100' : ''}`}
                >
                  ヘルプ
                </Link>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Menu>
    </div>
  );
}
