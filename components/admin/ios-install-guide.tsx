"use client";

import React from 'react';

export function IOSInstallGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xl">
      <p className="text-sm text-slate-700 leading-relaxed">
        iOSでホーム画面に追加するには、ブラウザの共有ボタンから「ホーム画面に追加」を選択してください。
      </p>
      <button onClick={onClose} className="mt-4 text-xs font-medium text-slate-400">
        閉じる
      </button>
    </div>
  );
}