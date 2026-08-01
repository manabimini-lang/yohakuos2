"use client";
import { useState } from "react";

type Action = {
  id: string;
  title: string;
  description?: string;
  kind?: string;
  reason?: string;
};

type Props = {
  actions: Action[];
  onCreateRecommendation?: () => void;
};

export default function ActionArea({ actions = [], onCreateRecommendation }: Props) {
  const [executing, setExecuting] = useState(false);
  const [openReasons, setOpenReasons] = useState<Record<string, boolean>>({});

  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">YUIからの提案</p>
          <h3 className="text-lg font-bold">Next Best Actions</h3>
        </div>
        <div>
          <button
            onClick={async () => {
              setExecuting(true);
              try {
                await (onCreateRecommendation?.() ?? Promise.resolve());
              } finally {
                setExecuting(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
          >
            {executing ? "作成中..." : "提案を作る"}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">提案はまだありません。『提案を作る』を押してみてください。</p>
        ) : (
          actions.slice(0, 3).map((a, index) => (
            <div key={a.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{a.title}</p>
                    {a.description ? <p className="mt-1 text-sm text-muted-foreground">{a.description}</p> : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">{a.kind ?? "提案"}</span>
                  {a.reason ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenReasons((current) => ({
                          ...current,
                          [a.id]: !current[a.id],
                        }))
                      }
                      className="text-xs font-semibold text-primary"
                    >
                      {openReasons[a.id] ? "理由を閉じる" : "理由を見る"}
                    </button>
                  ) : null}
                </div>
              </div>
              {openReasons[a.id] && a.reason ? (
                <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-xs leading-6 text-foreground/90">Why? {a.reason}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
