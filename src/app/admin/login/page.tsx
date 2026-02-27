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
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
        // Если пользователь вошел в Auth, но его нет в списке админов Firestore
        if (auth) await signOut(auth);
        toast({
          variant: "destructive",
          title: "Доступ запрещен",
          description: "Ваш UID отсутствует в коллекции 'roles_admin'. Проверьте настройки базы данных."
        });
      }
    } catch (e: any) {
      console.error("Admin check error:", e);
      toast({
        variant: "destructive",
        title: "Ошибка проверки",
        description: "Не удалось проверить права администратора."
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
    if (!auth || !db) {
      toast({
        variant: "destructive",
        title: "Сервисы не готовы",
        description: "Проверьте инициализацию Firebase в src/firebase/config.ts"
      });
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await checkAdminStatus(userCredential.user.uid);
    } catch (error: any) {
      let message = "Неверный email или пароль.";
      if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
        message = "Метод Email/Password не включен в Firebase Console.";
      } else if (error.code === 'auth/user-not-found') {
        message = "Пользователь не найден.";
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
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-border">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-headline">Вход в <span className="text-primary">Панель</span></CardTitle>
            <CardDescription>Только для авторизованных сотрудников</CardDescription>
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
                  autoComplete="email"
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
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {loading ? "Авторизация..." : "Войти"}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-[10px] text-muted-foreground leading-relaxed">
              <p className="font-bold mb-1 uppercase tracking-widest text-primary">Если вход не удается:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Включите Email/Password в Firebase Console (Authentication).</li>
                <li>Создайте коллекцию "roles_admin" в Firestore.</li>
                <li>Добавьте документ, где ID — ваш UID (возьмите из раздела Users).</li>
                <li>Внутри документа добавьте любое поле, например: role: "admin".</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}