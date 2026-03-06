
"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, AlertCircle, Copy, Check, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deniedUid, setDeniedUid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
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
        toast({
          variant: "destructive",
          title: "Доступ ограничен",
          description: "Ваш UID не найден в списке администраторов."
        });
      }
    } catch (e: any) {
      setDeniedUid(uid);
    }
  };

  useEffect(() => {
    if (!isUserLoading && user) {
      checkAdminStatus(user.uid);
    }
  }, [user, isUserLoading]);

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
      toast({ 
        variant: "destructive", 
        title: "Вход не удался", 
        description: "Неверный Email или пароль." 
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

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8">
        <Button variant="ghost" className="rounded-full"><ArrowLeft className="mr-2 w-4 h-4" /> Вернуться на сайт</Button>
      </Link>
      
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-2xl border-border rounded-[2.5rem]">
          <CardHeader className="text-center pt-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Admin.Connect</CardTitle>
            <CardDescription>Управление вашей парикмахерской</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="email" 
                  placeholder="Email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={loading}
                  className="h-12 rounded-xl"
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
                  className="h-12 rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                Войти в панель
              </Button>
            </form>
          </CardContent>
        </Card>

        {deniedUid && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 animate-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <p className="text-sm font-bold text-destructive">UID не найден в roles_admin!</p>
                <div className="flex items-center gap-2 bg-background/50 p-2 rounded-xl border border-border">
                  <code className="text-[10px] break-all flex-1">{deniedUid}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
