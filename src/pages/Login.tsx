import * as React from "react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BrainCircuit, Mail, Lock, Loader2, Globe } from "lucide-react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("確認メールを送信しました。メールを確認してください。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("ログインしました");
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "認証に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google auth error:", error);
      toast.error(error.message || "Googleログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white overflow-hidden">
        <div className="h-1.5 w-full bg-brand" />
        <CardHeader className="space-y-4 pt-10 pb-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight">
              YOHAKU OS
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              {isSignUp ? "アカウントを作成して余白のある生活を始めましょう" : "おかえりなさい。ログインして作業を再開しましょう"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-10">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-11 bg-notion-bg border-border/50 rounded-lg focus:ring-brand/20 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-notion-bg border-border/50 rounded-lg focus:ring-brand/20 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              className="w-full h-11 font-black text-sm bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20 rounded-lg mt-4" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                isSignUp ? "アカウント作成" : "ログイン"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-white px-4 text-muted-foreground">または</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-bold border-border/50 hover:bg-notion-bg transition-colors"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Googleでログイン
              </div>
            )}
          </Button>

          <p className="text-center text-sm font-medium text-muted-foreground">
            {isSignUp ? "すでにアカウントをお持ちですか？" : "まだアカウントをお持ちでないですか？"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-brand font-black hover:underline underline-offset-4 decoration-2"
            >
              {isSignUp ? "ログイン" : "サインアップ"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
