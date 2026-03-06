
"use client";

import { ReactNode } from "react";
import { useUser, useFirestore } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, LayoutDashboard, Scissors, LogOut, Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isUserLoading || isLoginPage) return;
    if (!user) {
      router.push("/admin/login");
      return;
    }

    const verify = async () => {
      if (!db) return;
      try {
        const adminSnap = await getDoc(doc(db, "roles_admin", user.uid));
        if (!adminSnap.exists()) {
          router.push("/admin/login");
        } else {
          setIsAdmin(true);
        }
      } catch (e) {
        router.push("/admin/login");
      }
    };
    verify();
  }, [user, isUserLoading, db, router, isLoginPage]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/admin/login");
    }
  };

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (isUserLoading || (isAdmin === null && !isLoginPage)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const menuItems = [
    { name: "Дашборд", href: "/admin", icon: LayoutDashboard },
    { name: "Сайт", href: "/", icon: Scissors },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border h-screen sticky top-0 shadow-2xl">
        <div className="p-8">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Scissors className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-headline font-bold tracking-tight">Админ.Панель</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button 
                variant={pathname === item.href ? "default" : "ghost"} 
                className={cn(
                  "w-full justify-start rounded-xl h-12 px-4 transition-all duration-300",
                  pathname === item.href ? "shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-muted/30 rounded-2xl p-4 mb-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Аккаунт</p>
            <p className="text-xs font-medium truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3" /> Выйти
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="text-white w-4 h-4" />
            </div>
            <span className="font-headline font-bold">Админ</span>
         </div>
         <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
           {isMobileMenuOpen ? <X /> : <Menu />}
         </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-20 px-4 animate-in fade-in slide-in-from-top-4">
          <nav className="space-y-4">
            {menuItems.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant={pathname === item.href ? "default" : "ghost"} className="w-full h-14 text-lg rounded-2xl">
                  <item.icon className="w-5 h-5 mr-4" /> {item.name}
                </Button>
              </Link>
            ))}
            <Button variant="ghost" className="w-full h-14 text-lg text-destructive rounded-2xl" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-4" /> Выход
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/10">
        {children}
      </main>
    </div>
  );
}
