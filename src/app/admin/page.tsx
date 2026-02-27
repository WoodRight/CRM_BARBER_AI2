"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Scissors, 
  Settings, 
  Clock,
  DollarSign,
  LogOut,
  Plus,
  Trash2,
  Database,
  Loader2
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

  // Состояния для форм добавления
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newBarberName, setNewBarberName] = useState("");

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

  const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);
  const { data: barbers, isLoading: barbersLoading } = useCollection(barbersQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = () => {
    if (auth) signOut(auth);
  };

  const handleAddService = async () => {
    if (!db || !newServiceName || !newServicePrice) return;
    try {
      await addDoc(collection(db, "services"), {
        name: newServiceName,
        price: Number(newServicePrice),
        durationMinutes: 45, // Значение по умолчанию
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
      // Пример расширенного списка услуг
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
      
      // Пример мастеров
      const b1 = await addDoc(collection(db, "barbers"), { 
        name: "Алекс Риверс", 
        firstName: "Алекс",
        lastName: "Риверс",
        email: "alex@barbertok.ru",
        role: "Топ-барбер", 
        rating: 4.9, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const b2 = await addDoc(collection(db, "barbers"), { 
        name: "Сара Чен", 
        firstName: "Сара",
        lastName: "Чен",
        email: "sarah@barbertok.ru",
        role: "Старший стилист", 
        rating: 4.8, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Пример записей
      await addDoc(collection(db, "bookings"), {
        clientName: "Дмитрий Иванов",
        serviceName: "Фирменная стрижка",
        barberName: "Алекс Риверс",
        date: "2024-05-20",
        time: "14:00",
        status: "confirmed",
        totalPrice: 2500,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "bookings"), {
        clientName: "Максим Сидоров",
        serviceName: "Стрижка и борода",
        barberName: "Сара Чен",
        date: "2024-05-21",
        time: "10:00",
        status: "confirmed",
        totalPrice: 3500,
        createdAt: serverTimestamp()
      });

      toast({ title: "Демо-данные успешно созданы!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ошибка сидирования", description: e.message });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Проверка доступа...</p>
        </div>
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
            <p className="text-muted-foreground">Добро пожаловать, {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={seedDemoData} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Демо-данные
            </Button>
            <Button variant="outline" className="rounded-full border-border" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Выйти
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Всего записей", value: bookings?.length || 0, icon: Calendar, trend: "+12%", color: "text-accent", bg: "bg-accent/10" },
            { label: "Выручка", value: `${totalRevenue} ₽`, icon: DollarSign, trend: "Факт", color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Услуг", value: services?.length || 0, icon: Scissors, trend: "Активные", color: "text-primary", bg: "bg-primary/10" },
            { label: "Мастеров", value: barbers?.length || 0, icon: Users, trend: "В штате", color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-md bg-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className="bg-muted/50 text-xs">{stat.trend}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="bookings">Записи</TabsTrigger>
            <TabsTrigger value="services">Услуги</TabsTrigger>
            <TabsTrigger value="team">Команда</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>История бронирования</CardTitle>
                <CardDescription>Все активные записи в реальном времени.</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Услуга</TableHead>
                        <TableHead>Мастер</TableHead>
                        <TableHead>Дата/Время</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings?.map((bk: any) => (
                        <TableRow key={bk.id}>
                          <TableCell className="font-bold">{bk.clientName}</TableCell>
                          <TableCell>{bk.serviceName}</TableCell>
                          <TableCell>{bk.barberName}</TableCell>
                          <TableCell>{bk.date} в {bk.time}</TableCell>
                          <TableCell>
                            <Badge className={cn(bk.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500')}>
                              {bk.status === 'confirmed' ? 'Подтверждено' : bk.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">{bk.totalPrice} ₽</TableCell>
                          <TableCell>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete("bookings", bk.id)}>
                               <Trash2 className="w-4 h-4 text-destructive" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {bookings?.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Записей пока нет</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle>Новая услуга</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Название услуги" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
                  <Input type="number" placeholder="Цена (₽)" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} />
                  <Button className="w-full" onClick={handleAddService}><Plus className="w-4 h-4 mr-2" /> Добавить</Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Список услуг</CardTitle></CardHeader>
                <CardContent>
                   <Table>
                     <TableHeader>
                        <TableRow>
                          <TableHead>Название</TableHead>
                          <TableHead>Цена</TableHead>
                          <TableHead></TableHead>
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="lg:col-span-1">
                <CardHeader><CardTitle>Новый мастер</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Имя мастера" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} />
                  <Button className="w-full" onClick={handleAddBarber}><Plus className="w-4 h-4 mr-2" /> Добавить мастера</Button>
                </CardContent>
              </Card>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {barbers?.map((barber: any) => (
                  <Card key={barber.id}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                          <img src={`https://picsum.photos/seed/${barber.name}/100/100`} alt={barber.name} className="object-cover h-full w-full" />
                        </div>
                        <div>
                          <h3 className="font-bold">{barber.name}</h3>
                          <p className="text-xs text-muted-foreground">{barber.role}</p>
                        </div>
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
        </Tabs>
      </main>
    </div>
  );
}
