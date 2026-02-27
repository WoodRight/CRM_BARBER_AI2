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
import { ShieldCheck, Loader2, AlertCircle, Copy, Check, Key } from "lucide-react";
import { firebaseConfig } from "@/firebase/config";

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

  // Проверка: заполнены ли ключи в config.ts
  const isConfigPlaceholder = firebaseConfig.apiKey.includes("ВАШ_API_KEY") || firebaseConfig.projectId.includes("ВАШ_PROJECT_ID");

  const checkAdminStatus = async (uid: string) => {
    if (!db) return;
    try {
      const adminRef = doc(db, "roles_admin", uid);
      const adminSnap = await getDoc(adminRef);
      
      if (adminSnap.exists()) {
        router.push("/admin");
      } else {
        setDeniedUid(uid);
        // Если вошли в Auth, но нет прав в БД - выходим из Auth, чтобы не висеть в сессии
        if (auth) await signOut(auth);
        toast({
          variant: "destructive",
          title: "Доступ запрещен",
          description: "Учетная запись верна, но у вас нет прав администратора."
        });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Ошибка Firestore",
        description: "Не удалось проверить роль. Проверьте Security Rules в консоли Firebase."
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
    
    if (isConfigPlaceholder) {
      toast({
        variant: "destructive",
        title: "Конфигурация не найдена",
        description: "Пожалуйста, вставьте реальные ключи в файл src/firebase/config.ts"
      });
      return;
    }

    if (!auth) return;
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // После успешного логина сработает useEffect, который вызовет checkAdminStatus
    } catch (error: any) {
      console.error("Auth error code:", error.code);
      let message = "Неверный логин или пароль.";
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "Неверные учетные данные. Проверьте Email и пароль в Firebase Console.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Слишком много попыток. Попробуйте позже.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Ошибка сети. Проверьте соединение.";
      }
      
      toast({ 
        variant: "destructive", 
        title: "Ошибка входа", 
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
          {isConfigPlaceholder && (
            <Alert variant="destructive" className="mb-4">
              <Key className="h-4 w-4" />
              <AlertTitle>Внимание!</AlertTitle>
              <AlertDescription>
                Вы используете пустые ключи в <b>src/firebase/config.ts</b>. Вход невозможен.
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-2xl border-border">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-headline font-bold">Панель <span className="text-primary">Управления</span></CardTitle>
              <CardDescription>Вход для администраторов BarBerTok</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input 
                    type="email" 
                    placeholder="Email (admin@example.com)" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    disabled={loading}
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
                  />
                </div>
                <Button type="submit" className="w-full h-11 font-bold" disabled={loading || isConfigPlaceholder}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {loading ? "Авторизация..." : "Войти в систему"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {deniedUid && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 animate-in slide-in-from-bottom-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-3 flex-1">
                  <p className="text-sm font-bold text-destructive">UID не авторизован!</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Вы успешно вошли как пользователь, но вас нет в списке админов. 
                    Добавьте этот ID в коллекцию <b>roles_admin</b>:
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

          <div className="p-4 bg-muted/30 rounded-lg text-[10px] text-muted-foreground">
             <p className="font-bold uppercase tracking-wider mb-2">Напоминание для запуска:</p>
             <ol className="list-decimal list-inside space-y-1">
               <li>Проверьте <b>src/firebase/config.ts</b></li>
               <li>Включите <b>Email/Password</b> в консоли Firebase</li>
               <li>Создайте коллекцию <b>roles_admin</b> в Firestore</li>
             </ol>
          </div>
        </div>
      </main>
    </div>
  );
}

// Заглушки для Alert, если они не импортированы из UI
function Alert({ children, variant, className }: any) {
  return <div className={`p-4 rounded-lg border ${variant === 'destructive' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-muted'} ${className}`}>{children}</div>
}
function AlertTitle({ children }: any) {
  return <h5 className="font-bold mb-1">{children}</h5>
}
function AlertDescription({ children }: any) {
  return <div className="text-sm opacity-90">{children}</div>
}
