"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, AlertCircle, Copy, Check, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deniedUid, setDeniedUid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const checkAdminStatus = async (uid: string) => {
    if (!db) return;
    try {
      const adminRef = doc(db, "roles_admin", uid);
      const adminSnap = await getDoc(adminRef);
      
      if (adminSnap.exists()) {
        router.push("/admin");
      } else {
        setDeniedUid(uid);
        // Мы не выходим из системы сразу, чтобы пользователь мог увидеть свой UID
        toast({
          variant: "destructive",
          title: "Доступ ограничен",
          description: "Ваш UID не найден в списке администраторов."
        });
      }
    } catch (e: any) {
      setDeniedUid(uid);
      toast({
        variant: "destructive",
        title: "Ошибка проверки прав",
        description: "Убедитесь, что ваш UID добавлен в коллекцию roles_admin."
      });
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminStatus(user.uid);
    }
  }, [user, authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeniedUid(null);
    
    if (!auth) {
      toast({ variant: "destructive", title: "Ошибка", description: "Сервис авторизации недоступен." });
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let message = "Неверный Email или пароль.";
      if (error.code === 'auth/network-request-failed') {
        message = "Ошибка сети. Проверьте подключение к базе данных.";
      }
      toast({ 
        variant: "destructive", 
        title: "Вход не удался", 
        description: message 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (deniedUid) {
      navigator.clipboard.writeText(deniedUid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md space-y-4">
          <Card className="shadow-2xl border-border">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-headline font-bold">Вход для <span className="text-primary">Админа</span></CardTitle>
              <CardDescription>BarBerTok Management System</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    disabled={loading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Input 
                    type="password" 
                    placeholder="Пароль" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    disabled={loading}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  {loading ? "Проверка..." : "Войти в панель"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {deniedUid && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 animate-in slide-in-from-bottom-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-3 flex-1">
                  <p className="text-sm font-bold text-destructive">UID не найден в roles_admin!</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Вы успешно авторизованы, но у вас нет прав админа. Добавьте этот ID в Firestore:
                  </p>
                  <div className="flex items-center gap-2 bg-background/50 p-2 rounded border border-border">
                    <code className="text-[10px] break-all flex-1">{deniedUid}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
