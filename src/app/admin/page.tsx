
"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, addDoc, serverTimestamp, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Calendar, 
  Scissors, 
  Settings, 
  LogOut,
  Plus,
  Trash2,
  Database,
  Loader2,
  Save,
  UserPlus
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

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
  
  // Состояния для клиентов
  const [clientForm, setClientForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  // Состояния для настроек контента
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const [ctaImg1, setCtaImg1] = useState("");
  const [ctaImg2, setCtaImg2] = useState("");
  const [ctaImg3, setCtaImg3] = useState("");
  const [ctaImg4, setCtaImg4] = useState("");

  // Мемоизированные запросы для ускорения загрузки
  // Защищенные запросы (только для админов)
  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(50));
  }, [db, isAdmin]);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, "clients"), orderBy("firstName", "asc"));
  }, [db, isAdmin]);

  // Публичные или полупубличные запросы
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
  const { data: clients, isLoading: clientsLoading } = useCollection(clientsQuery);
  const { data: siteContent } = useDoc(siteContentRef);

  // Быстрая проверка прав
  useEffect(() => {
    if (isUserLoading) return;
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
        console.error("Permission check failed", e);
        router.push("/admin/login");
      }
    };
    verify();
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

  const handleSaveContent = () => {
    if (!db) return;
    setIsSavingContent(true);
    setDocumentNonBlocking(doc(db, "settings", "site-content"), {
      heroBgUrl,
      ctaImages: [ctaImg1, ctaImg2, ctaImg3, ctaImg4],
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    setTimeout(() => {
      setIsSavingContent(false);
      toast({ title: "Контент обновлен!" });
    }, 500);
  };

  const handleAddService = () => {
    if (!db || !newServiceName || !newServicePrice) return;
    addDocumentNonBlocking(collection(db, "services"), {
      name: newServiceName,
      price: Number(newServicePrice),
      durationMinutes: 45,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setNewServiceName("");
    setNewServicePrice("");
    toast({ title: "Услуга добавлена" });
  };

  const handleAddBarber = () => {
    if (!db || !newBarberName) return;
    addDocumentNonBlocking(collection(db, "barbers"), {
      name: newBarberName,
      firstName: newBarberName.split(' ')[0],
      lastName: newBarberName.split(' ')[1] || "",
      email: `${newBarberName.toLowerCase().replace(/\s+/g, '.')}@barbertok.ru`,
      role: "Мастер",
      rating: 5.0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setNewBarberName("");
    toast({ title: "Мастер добавлен" });
  };

  const handleAddClient = () => {
    if (!db || !clientForm.firstName || !clientForm.email) return;
    addDocumentNonBlocking(collection(db, "clients"), {
      ...clientForm,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setClientForm({ firstName: "", lastName: "", email: "", phone: "" });
    toast({ title: "Клиент добавлен" });
  };

  const handleDelete = (collName: string, id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, collName, id));
    toast({ title: "Удалено" });
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
            <Button variant="outline" className="rounded-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto">
            <TabsTrigger value="bookings"><Calendar className="w-4 h-4 mr-2" /> Записи</TabsTrigger>
            <TabsTrigger value="clients"><Users className="w-4 h-4 mr-2" /> Клиенты</TabsTrigger>
            <TabsTrigger value="services"><Scissors className="w-4 h-4 mr-2" /> Услуги</TabsTrigger>
            <TabsTrigger value="team"><Users className="w-4 h-4 mr-2" /> Команда</TabsTrigger>
            <TabsTrigger value="content"><Settings className="w-4 h-4 mr-2" /> Контент</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card>
              <CardHeader>
                <CardTitle>Последние записи</CardTitle>
                <CardDescription>Отображаются последние 50 бронирований.</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Услуга</TableHead>
                        <TableHead>Дата/Время</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead className="text-right">Действие</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings?.map((bk: any) => (
                        <TableRow key={bk.id}>
                          <TableCell className="font-bold">{bk.clientName}</TableCell>
                          <TableCell>{bk.serviceName}</TableCell>
                          <TableCell>{bk.date} в {bk.time}</TableCell>
                          <TableCell>{bk.totalPrice} ₽</TableCell>
                          <TableCell className="text-right">
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

          <TabsContent value="clients" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Новый клиент</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Имя</Label>
                    <Input value={clientForm.firstName} onChange={e => setClientForm({...clientForm, firstName: e.target.value})} placeholder="Иван" />
                  </div>
                  <div className="space-y-2">
                    <Label>Фамилия</Label>
                    <Input value={clientForm.lastName} onChange={e => setClientForm({...clientForm, lastName: e.target.value})} placeholder="Иванов" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} placeholder="ivan@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <Input value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="+7 (999) 000-00-00" />
                  </div>
                  <Button className="w-full" onClick={handleAddClient}><UserPlus className="w-4 h-4 mr-2" /> Добавить клиента</Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  {clientsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-40 w-full" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Имя</TableHead>
                          <TableHead>Контакты</TableHead>
                          <TableHead className="text-right">Действие</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {clients?.map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                              <TableCell>
                                <div className="text-sm">{c.email}</div>
                                <div className="text-xs text-muted-foreground">{c.phone}</div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete("clients", c.id)}>
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

          <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                  {servicesLoading ? <Skeleton className="h-64 w-full" /> : (
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

          <TabsContent value="team" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                {barbersLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />) : (
                  barbers?.map((barber: any) => (
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
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>Настройка изображений</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <Label>Фон Hero</Label>
                  <Input placeholder="URL изображения" value={heroBgUrl} onChange={e => setHeroBgUrl(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[setCtaImg1, setCtaImg2, setCtaImg3, setCtaImg4].map((setter, idx) => (
                    <div key={idx} className="space-y-2">
                      <Label>Блок ИИ: Фото {idx + 1}</Label>
                      <Input value={[ctaImg1, ctaImg2, ctaImg3, ctaImg4][idx]} onChange={e => setter(e.target.value)} placeholder="URL фото" />
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-white" onClick={handleSaveContent} disabled={isSavingContent}>
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
