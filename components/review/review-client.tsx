"use client";

import { useEffect, useState } from "react";
import { getPersonalLogs, PersonalLog } from "@/lib/utils/log-db";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

type TopTag = {
  name: string;
  count: number;
};

export function ReviewClient() {
  const [logs, setLogs] = useState<PersonalLog[]>([]);
  const [thisMonthCount, setThisMonthCount] = useState(0);
  const [topTags, setTopTags] = useState<TopTag[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [moodData, setMoodData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getPersonalLogs();
      setLogs(data);
      calculateStats(data);
    }
    load();
  }, []);

  const calculateStats = (data: PersonalLog[]) => {
    if (data.length === 0) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. 今月の記録数
    const thisMonthLogs = data.filter((log) => {
      const d = new Date(log.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    setThisMonthCount(thisMonthLogs.length);

    // 2. 継続日数
    // dataは降順にソートされている前提
    const uniqueDates = Array.from(new Set(data.map(log => {
      const d = new Date(log.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })));

    let streak = 0;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let currentDate = new Date();

    let startIndex = 0;
    if (uniqueDates[0] === todayStr) {
      streak = 1;
      startIndex = 1;
      currentDate = today;
    } else if (uniqueDates[0] === yesterdayStr) {
      streak = 1;
      startIndex = 1;
      currentDate = yesterday;
    }

    if (streak > 0) {
      for (let i = startIndex; i < uniqueDates.length; i++) {
        currentDate.setDate(currentDate.getDate() - 1);
        const expectedStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        if (uniqueDates[i] === expectedStr) {
          streak++;
        } else {
          break;
        }
      }
    }
    setCurrentStreak(streak);

    // 3. よく使ったタグ
    const tagCounts: Record<string, number> = {};
    data.forEach(log => {
      log.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const sortedTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
    setTopTags(sortedTags);

    // 4. mood推移 (直近30件)
    const recentLogs = data.slice(0, 30).reverse();
    const chartData = recentLogs.map((log, index) => ({
      index,
      mood: log.mood, // -2 to +2
    }));
    setMoodData(chartData);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:py-24 space-y-16">
      <div className="text-center space-y-2 mb-16">
        <h1 className="text-xl font-medium text-foreground tracking-wider">Review</h1>
        <p className="text-sm text-muted-foreground">静かに歩みを振り返る</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-12">
          まだログがありません。まずは記録をつけてみましょう。
        </div>
      ) : (
        <>
          {/* Metrics Section */}
          <section className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">This Month</span>
              <p className="text-3xl font-light text-foreground">{thisMonthCount} <span className="text-base text-muted-foreground">Logs</span></p>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Current Streak</span>
              <p className="text-3xl font-light text-foreground">{currentStreak} <span className="text-base text-muted-foreground">Days</span></p>
            </div>
          </section>

          {/* Mood Trend Section */}
          <section className="space-y-6 pt-8 border-t border-slate-100">
            <div className="space-y-1">
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Mood Trend</span>
              <p className="text-sm text-muted-foreground">直近の感情の波</p>
            </div>
            
            <div className="h-32 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorMood)" 
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Tags Section */}
          <section className="space-y-6 pt-8 border-t border-slate-100">
            <div className="space-y-1">
              <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Frequent Tags</span>
              <p className="text-sm text-muted-foreground">よく記録しているテーマ</p>
            </div>

            {topTags.length > 0 ? (
              <ul className="space-y-3">
                {topTags.map((tag, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">#{tag.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">{tag.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">タグがありません</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
