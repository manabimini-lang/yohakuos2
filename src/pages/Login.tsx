import * as React from "react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BrainCircuit, Mail, Lock, Loader2 } from "lucide-react";

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
      toast.error(error.message || "認証に失敗しました");
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
