
"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  Scissors, 
  LogOut,
  Plus,
  Trash2,
  Loader2,
  UserPlus,
  Star,
  LayoutDashboard,
  UserCircle
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Состояния для форм
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newBarberName, setNewBarberName] = useState("");
  const [newBarberRole, setNewBarberRole] = useState("Барбер");
  
  const [clientForm, setClientForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  // Быстрая проверка прав администратора
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
        router.push("/admin/login");
      }
    };
    verify();
  }, [user, isUserLoading, db, router]);

  const bookingsQuery = useMemoFirebase(() => {
    if (!db || isAdmin === false) return null;
    return query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(50));
  }, [db, isAdmin]);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || isAdmin === false) return null;
    return query(collection(db, "clients"), orderBy("firstName", "asc"));
  }, [db, isAdmin]);

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
  const { data: clients, isLoading: clientsLoading } = useCollection(clientsQuery);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/admin/login");
    }
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
      role: newBarberRole,
      rating: 5,
      reviewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setNewBarberName("");
    toast({ title: "Мастер добавлен" });
  };

  const handleAddClient = () => {
    if (!db || !clientForm.firstName) return;
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 bg-card/30 p-8 rounded-[2rem] border border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight">Панель <span className="text-accent">Администратора</span></h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {user?.email}
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full h-12 px-8 border-primary/20 hover:bg-primary/5 transition-all" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Выйти из системы
          </Button>
        </div>

        <Tabs defaultValue="bookings" className="space-y-8">
          <div className="flex justify-center sm:justify-start">
            <TabsList className="bg-muted/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md shadow-inner overflow-x-auto flex-nowrap scrollbar-hide">
              <TabsTrigger value="bookings" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
                <Calendar className="w-4 h-4 mr-2" /> Записи
              </TabsTrigger>
              <TabsTrigger value="clients" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
                <Users className="w-4 h-4 mr-2" /> Клиенты
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
                <Scissors className="w-4 h-4 mr-2" /> Услуги
              </TabsTrigger>
              <TabsTrigger value="team" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
                <UserCircle className="w-4 h-4 mr-2" /> Команда
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="bookings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Card className="rounded-[2rem] border-border/50 shadow-xl overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 p-8">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Ближайшие визиты</CardTitle>
                    <CardDescription>Актуальный список записей на сегодня и ближайшие дни.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {bookingsLoading ? <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/10">
                        <TableHead className="py-5 px-8">Клиент</TableHead>
                        <TableHead>Услуга</TableHead>
                        <TableHead>Мастер</TableHead>
                        <TableHead>Дата и Время</TableHead>
                        <TableHead className="text-right px-8">Действие</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings?.map((bk: any) => (
                        <TableRow key={bk.id} className="hover:bg-muted/5 transition-colors">
                          <TableCell className="font-bold py-5 px-8">
                            <div className="flex flex-col">
                              <span>{bk.clientName}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">{bk.clientPhone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/10">
                              {bk.serviceName}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-muted-foreground">{bk.barberName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{bk.date}</span>
                              <span className="text-accent font-bold bg-accent/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-tighter">{bk.time}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-8">
                             <Button variant="ghost" size="icon" onClick={() => handleDelete("bookings", bk.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-full">
                               <Trash2 className="w-4 h-4" />
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

          <TabsContent value="clients" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="h-fit rounded-[2rem] border-border/50 shadow-lg">
                <CardHeader className="p-8"><CardTitle className="text-xl flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Новый клиент</CardTitle></CardHeader>
                <CardContent className="p-8 pt-0 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Имя</Label>
                    <Input placeholder="Александр" value={clientForm.firstName} onChange={e => setClientForm({...clientForm, firstName: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-transparent focus:bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Телефон</Label>
                    <Input placeholder="+7..." value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-transparent focus:bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email (опционально)</Label>
                    <Input placeholder="email@example.com" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-transparent focus:bg-background" />
                  </div>
                  <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleAddClient}>
                    Добавить в базу
                  </Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 rounded-[2rem] border-border/50 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  {clientsLoading ? <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : (
                    <Table>
                      <TableHeader><TableRow className="bg-muted/10 hover:bg-transparent"><TableHead className="py-5 px-8">Имя клиента</TableHead><TableHead>Контакты</TableHead><TableHead className="text-right px-8">Удалить</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {clients?.map((c: any) => (
                            <TableRow key={c.id} className="hover:bg-muted/5">
                              <TableCell className="font-bold py-5 px-8">{c.firstName} {c.lastName}</TableCell>
                              <TableCell>
                                <div className="flex flex-col text-sm">
                                  <span>{c.phone}</span>
                                  <span className="text-muted-foreground text-xs">{c.email}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right px-8">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete("clients", c.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-full"><Trash2 className="w-4 h-4" /></Button>
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

          <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="h-fit rounded-[2rem] border-border/50 shadow-lg">
                <CardHeader className="p-8"><CardTitle className="text-xl flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Новая услуга</CardTitle></CardHeader>
                <CardContent className="p-8 pt-0 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Название услуги</Label>
                    <Input placeholder="Стрижка бороды" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-transparent" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Цена (₽)</Label>
                    <Input type="number" placeholder="1500" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-transparent" />
                  </div>
                  <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleAddService}>
                    Добавить в каталог
                  </Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 rounded-[2rem] border-border/50 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  {servicesLoading ? <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /></div> : (
                    <Table>
                      <TableHeader><TableRow className="bg-muted/10 hover:bg-transparent"><TableHead className="py-5 px-8">Название</TableHead><TableHead>Стоимость</TableHead><TableHead className="text-right px-8">Удалить</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {services?.map((s: any) => (
                            <TableRow key={s.id} className="hover:bg-muted/5">
                              <TableCell className="font-bold py-5 px-8">{s.name}</TableCell>
                              <TableCell>
                                <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold border border-accent/10">
                                  {s.price} ₽
                                </span>
                              </TableCell>
                              <TableCell className="text-right px-8">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete("services", s.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-full"><Trash2 className="w-4 h-4" /></Button>
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

          <TabsContent value="team" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <Card className="h-fit rounded-[2rem] border-border/50 shadow-lg">
                <CardHeader className="p-8"><CardTitle className="text-xl flex items-center gap-2"><UserCircle className="w-5 h-5 text-primary" /> Новый мастер</CardTitle></CardHeader>
                <CardContent className="p-8 pt-0 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Имя мастера</Label>
                    <Input placeholder="Иван" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-transparent" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Категория</Label>
                    <Select value={newBarberRole} onValueChange={setNewBarberRole}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-transparent"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                        <SelectItem value="Топ-барбер">Топ-барбер</SelectItem>
                        <SelectItem value="Мастер">Мастер</SelectItem>
                        <SelectItem value="Барбер">Барбер</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleAddBarber}>
                    Добавить в команду
                  </Button>
                </CardContent>
              </Card>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {barbersLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />) : (
                  barbers?.map((barber: any) => (
                    <Card key={barber.id} className="rounded-[2rem] border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <CardContent className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-full overflow-hidden border-2 border-background shadow-sm">
                            <img src={`https://picsum.photos/seed/${barber.id}/150/150`} alt={barber.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg leading-tight">{barber.name}</h3>
                            <div className="flex flex-col gap-2 mt-2">
                              <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase w-fit tracking-tighter">
                                {barber.role}
                              </span>
                              <div className="flex items-center text-xs text-amber-500 font-bold">
                                <Star className="w-3 h-3 fill-amber-500 mr-1" /> {barber.rating || 5.0} <span className="text-muted-foreground ml-1">({barber.reviewCount || 0})</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete("barbers", barber.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
