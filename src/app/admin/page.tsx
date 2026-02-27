
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, setDoc } from "firebase/firestore";
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
  DollarSign,
  LogOut,
  Plus,
  Trash2,
  Database,
  Loader2,
  Image as ImageIcon,
  Save
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
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Состояния для форм добавления
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newBarberName, setNewBarberName] = useState("");

  // Состояния для настроек контента
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const [ctaImg1, setCtaImg1] = useState("");
  const [ctaImg2, setCtaImg2] = useState("");
  const [ctaImg3, setCtaImg3] = useState("");
  const [ctaImg4, setCtaImg4] = useState("");

  // Запросы к Firestore
  const bookingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "bookings"), orderBy("createdAt", "desc"));
  }, [db]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "services"), orderBy("createdAt", "desc"));
  }, [db]);

  const barbersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "barbers"), orderBy("createdAt", "desc"));
  }, [db]);

  const siteContentRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "site-content");
  }, [db]);

  const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);
  const { data: barbers, isLoading: barbersLoading } = useCollection(barbersQuery);
  const { data: siteContent } = useDoc(siteContentRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, isUserLoading, router]);

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

  const handleLogout = () => {
    if (auth) signOut(auth);
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

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalRevenue = bookings?.reduce((acc, curr: any) => acc + (curr.totalPrice || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Панель <span className="text-accent">Администратора</span></h1>
            <p className="text-muted-foreground">{user.email}</p>
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
                <CardTitle>Активные записи</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? <Skeleton className="h-40 w-full" /> : (
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
                  <Input placeholder="Название" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
                  <Input type="number" placeholder="Цена" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} />
                  <Button className="w-full" onClick={handleAddService}><Plus className="w-4 h-4 mr-2" /> Добавить</Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                   <Table>
                     <TableBody>
                        {services?.map((s: any) => (
                          <TableRow key={s.id}>
                            <TableCell>{s.name}</TableCell>
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card>
                <CardHeader><CardTitle>Новый мастер</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Имя Фамилия" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} />
                  <Button className="w-full" onClick={handleAddBarber}><Plus className="w-4 h-4 mr-2" /> Добавить</Button>
                </CardContent>
              </Card>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {barbers?.map((barber: any) => (
                  <Card key={barber.id}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <h3 className="font-bold">{barber.name}</h3>
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
                <CardDescription>Измените ссылки на фотографии на главной странице.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <Label>Фон в начале страницы (Hero Background)</Label>
                  <div className="flex gap-2">
                    <Input placeholder="URL изображения" value={heroBgUrl} onChange={e => setHeroBgUrl(e.target.value)} />
                    <Button variant="ghost" size="icon" asChild>
                      <a href={heroBgUrl} target="_blank" rel="noopener noreferrer"><ImageIcon className="w-4 h-4" /></a>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>ИИ Блок: Фото 1 (Стрижка)</Label>
                    <Input value={ctaImg1} onChange={e => setCtaImg1(e.target.value)} placeholder="URL фото" />
                  </div>
                  <div className="space-y-2">
                    <Label>ИИ Блок: Фото 2 (Борода)</Label>
                    <Input value={ctaImg2} onChange={e => setCtaImg2(e.target.value)} placeholder="URL фото" />
                  </div>
                  <div className="space-y-2">
                    <Label>ИИ Блок: Фото 3 (Фейд)</Label>
                    <Input value={ctaImg3} onChange={e => setCtaImg3(e.target.value)} placeholder="URL фото" />
                  </div>
                  <div className="space-y-2">
                    <Label>ИИ Блок: Фото 4 (Мастер)</Label>
                    <Input value={ctaImg4} onChange={e => setCtaImg4(e.target.value)} placeholder="URL фото" />
                  </div>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSaveContent} disabled={isSavingContent}>
                  {isSavingContent ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSavingContent ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
