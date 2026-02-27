"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, addDoc, serverTimestamp, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Calendar, 
  Scissors, 
  Settings, 
  Clock,
  LogOut,
  Plus,
  Trash2,
  Database,
  Loader2,
  Image as ImageIcon,
  Save,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Состояния для форм
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newBarberName, setNewBarberName] = useState("");

  // Состояния для настроек контента
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const [ctaImg1, setCtaImg1] = useState("");
  const [ctaImg2, setCtaImg2] = useState("");
  const [ctaImg3, setCtaImg3] = useState("");
  const [ctaImg4, setCtaImg4] = useState("");

  // Мемоизированные запросы
  const bookingsQuery = useMemoFirebase(() => {
    if (!db || isAdmin === false) return null;
    return query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(50));
  }, [db, isAdmin]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db || isAdmin === false) return null;
    return query(collection(db, "services"), orderBy("createdAt", "desc"));
  }, [db, isAdmin]);

  const barbersQuery = useMemoFirebase(() => {
    if (!db || isAdmin === false) return null;
    return query(collection(db, "barbers"), orderBy("createdAt", "desc"));
  }, [db, isAdmin]);

  const siteContentRef = useMemoFirebase(() => {
    if (!db || isAdmin === false) return null;
    return doc(db, "settings", "site-content");
  }, [db, isAdmin]);

  const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);
  const { data: barbers, isLoading: barbersLoading } = useCollection(barbersQuery);
  const { data: siteContent } = useDoc(siteContentRef);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!isUserLoading) {
        if (!user) {
          router.push("/admin/login");
        } else if (db) {
          try {
            const adminSnap = await getDoc(doc(db, "roles_admin", user.uid));
            if (adminSnap.exists()) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
              router.push("/admin/login");
            }
          } catch (e) {
            console.error("Verification error:", e);
            setIsAdmin(false);
          }
        }
      }
    };
    verifyAdmin();
  }, [user, isUserLoading, db, router]);

  useEffect(() => {
    if (siteContent) {
      setHeroBgUrl(siteContent.heroBgUrl || "");
      if (siteContent.ctaImages) {
        setCtaImg1(siteContent.ctaImages[0] || "");
        setCtaImg2(siteContent.ctaImages[1] || "");
        setCtaImg3(siteContent.ctaImages[2] || "");
        setCtaImg4(siteContent.ctaImages[3] || "");
      }
    }
  }, [siteContent]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/admin/login");
    }
  };

  const handleSaveContent = async () => {
    if (!db) return;
    setIsSavingContent(true);
    try {
      await setDoc(doc(db, "settings", "site-content"), {
        heroBgUrl,
        ctaImages: [ctaImg1, ctaImg2, ctaImg3, ctaImg4],
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Контент обновлен!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ошибка сохранения", description: e.message });
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleAddService = async () => {
    if (!db || !newServiceName || !newServicePrice) return;
    try {
      await addDoc(collection(db, "services"), {
        name: newServiceName,
        price: Number(newServicePrice),
        durationMinutes: 45,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewServiceName("");
      setNewServicePrice("");
      toast({ title: "Услуга добавлена" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ошибка", description: e.message });
    }
  };

  const handleAddBarber = async () => {
    if (!db || !newBarberName) return;
    try {
      await addDoc(collection(db, "barbers"), {
        name: newBarberName,
        firstName: newBarberName.split(' ')[0],
        lastName: newBarberName.split(' ')[1] || "",
        email: `${newBarberName.toLowerCase().replace(' ', '.')}@barbertok.ru`,
        role: "Мастер",
        rating: 5.0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewBarberName("");
      toast({ title: "Мастер добавлен" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ошибка", description: e.message });
    }
  };

  const handleDelete = async (collName: string, id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, collName, id));
      toast({ title: "Удалено успешно" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ошибка удаления", description: e.message });
    }
  };

  const seedDemoData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const demoServices = [
        { name: "Фирменная стрижка", price: 2500, durationMinutes: 45 },
        { name: "Стрижка и борода", price: 3500, durationMinutes: 75 },
        { name: "Моделирование бороды", price: 1500, durationMinutes: 30 },
        { name: "Королевское бритье", price: 2000, durationMinutes: 45 },
        { name: "Камуфляж седины", price: 1800, durationMinutes: 40 },
        { name: "Детская стрижка", price: 1800, durationMinutes: 40 },
        { name: "Отец + Сын (Комбо)", price: 3800, durationMinutes: 90 }
      ];

      for (const s of demoServices) {
        await addDoc(collection(db, "services"), {
          ...s,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      await addDoc(collection(db, "barbers"), { 
        name: "Алекс Риверс", 
        firstName: "Алекс",
        lastName: "Риверс",
        email: "alex@barbertok.ru",
        role: "Топ-барбер", 
        rating: 4.9, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({ title: "Демо-данные созданы!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ошибка", description: e.message });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isUserLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Панель <span className="text-accent">Администратора</span></h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={seedDemoData} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Демо
            </Button>
            <Button variant="outline" className="rounded-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto">
            <TabsTrigger value="bookings">Записи</TabsTrigger>
            <TabsTrigger value="services">Услуги</TabsTrigger>
            <TabsTrigger value="team">Команда</TabsTrigger>
            <TabsTrigger value="content"><Settings className="w-4 h-4 mr-2" /> Контент</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
             <Card>
              <CardHeader>
                <CardTitle>Последние записи</CardTitle>
                <CardDescription>Отображаются последние 50 бронирований.</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Услуга</TableHead>
                        <TableHead>Дата/Время</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings?.map((bk: any) => (
                        <TableRow key={bk.id}>
                          <TableCell className="font-bold">{bk.clientName}</TableCell>
                          <TableCell>{bk.serviceName}</TableCell>
                          <TableCell>{bk.date} в {bk.time}</TableCell>
                          <TableCell>{bk.totalPrice} ₽</TableCell>
                          <TableCell>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete("bookings", bk.id)}>
                               <Trash2 className="w-4 h-4 text-destructive" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {bookings?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Нет активных записей</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Добавить услугу</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input placeholder="Напр: Стрижка кроп" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Цена (₽)</Label>
                    <Input type="number" placeholder="Напр: 1500" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={handleAddService}><Plus className="w-4 h-4 mr-2" /> Добавить</Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  {servicesLoading ? (
                    <div className="space-y-2"><Skeleton className="h-20 w-full" /></div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Название</TableHead>
                          <TableHead>Цена</TableHead>
                          <TableHead className="text-right">Действие</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {services?.map((s: any) => (
                            <TableRow key={s.id}>
                              <TableCell className="font-medium">{s.name}</TableCell>
                              <TableCell>{s.price} ₽</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete("services", s.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card>
                <CardHeader><CardTitle>Новый мастер</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Имя и Фамилия</Label>
                    <Input placeholder="Александр Петров" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={handleAddBarber}><Plus className="w-4 h-4 mr-2" /> Добавить</Button>
                </CardContent>
              </Card>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {barbersLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : barbers?.map((barber: any) => (
                  <Card key={barber.id} className="hover:bg-accent/5 transition-colors">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{barber.name}</h3>
                        <p className="text-xs text-muted-foreground">{barber.role}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete("barbers", barber.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Настройка изображений</CardTitle>
                <CardDescription>Ссылки на фото главной страницы.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <Label>Фон Hero</Label>
                  <Input placeholder="URL изображения" value={heroBgUrl} onChange={e => setHeroBgUrl(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Блок ИИ: Фото 1</Label>
                    <Input value={ctaImg1} onChange={e => setCtaImg1(e.target.value)} placeholder="URL фото" />
                  </div>
                  <div className="space-y-2">
                    <Label>Блок ИИ: Фото 2</Label>
                    <Input value={ctaImg2} onChange={e => setCtaImg2(e.target.value)} placeholder="URL фото" />
                  </div>
                  <div className="space-y-2">
                    <Label>Блок ИИ: Фото 3</Label>
                    <Input value={ctaImg3} onChange={e => setCtaImg3(e.target.value)} placeholder="URL фото" />
                  </div>
                  <div className="space-y-2">
                    <Label>Блок ИИ: Фото 4</Label>
                    <Input value={ctaImg4} onChange={e => setCtaImg4(e.target.value)} placeholder="URL фото" />
                  </div>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-white" onClick={handleSaveContent} disabled={isSavingContent}>
                  {isSavingContent ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSavingContent ? "Сохранение..." : "Сохранить"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
