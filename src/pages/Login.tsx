import { signInWithGoogle } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogIn, Sparkles, Globe, BookOpen } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Navigate, useLocation } from "react-router-dom";

export default function Login() {
  const { session } = useStore();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  if (session) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Left side: Branding/Mood */}
      <div className="hidden md:flex flex-1 bg-notion-bg items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 bg-brand/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 h-96 w-96 bg-purple-500/5 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-md space-y-8 relative z-10">
            <div className="h-16 w-16 bg-brand rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-brand/20">
                Y
            </div>
            <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight text-notion-text leading-tight">
                    教育に、<br />もっと「余白」を。
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    YOHAKU OS は、多忙な先生たちのためのコミュニティ運営OSです。事務を減らし、対話を増やすデザイン。
                </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {[
                    { icon: Globe, label: "オープンなコミュニティ" },
                    { icon: Sparkles, label: "AI による提案" },
                    { icon: BookOpen, label: "豊富な限定教材" },
                    { icon: LogIn, label: "シームレスな体験" }
                ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-notion-text/70">
                        <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                            <feature.icon className="h-4 w-4 text-brand" />
                        </div>
                        {feature.label}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm space-y-10">
          <div className="text-center md:text-left space-y-2">
            <div className="md:hidden flex justify-center mb-6">
                 <div className="h-12 w-12 bg-brand rounded-xl flex items-center justify-center text-white text-2xl font-black">Y</div>
            </div>
            <h2 className="text-3xl font-black tracking-tight">おかえりなさい</h2>
            <p className="text-muted-foreground font-medium">Google アカウントでログインして始めましょう</p>
          </div>

          <div className="space-y-4">
            <Button 
                onClick={() => signInWithGoogle()}
                className="w-full h-14 bg-white hover:bg-gray-50 text-notion-text border-2 border-border shadow-sm flex items-center justify-center gap-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="font-black text-base">Google でログイン</span>
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                ログインすることで、私たちの <a href="#" className="underline hover:text-brand">利用規約</a> と <a href="#" className="underline hover:text-brand">プライバシーポリシー</a> に同意したことになります。
            </p>
          </div>

          <div className="pt-10 flex items-center justify-center gap-4">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-border" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">About YOHAKU</span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>

          <div className="flex justify-center gap-6">
              <button className="text-xs font-bold text-muted-foreground hover:text-brand">お問い合わせ</button>
              <button className="text-xs font-bold text-muted-foreground hover:text-brand">運営会社</button>
          </div>
        </div>
      </div>
    </div>
  );
}
