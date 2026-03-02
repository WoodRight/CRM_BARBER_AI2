
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
  Settings, 
  LogOut,
  Plus,
  Trash2,
  Loader2,
  Save,
  UserPlus,
  Star
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
  const [isSavingContent, setIsSavingContent] = useState(false);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Панель <span className="text-accent">Администратора</span></h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
          <Button variant="outline" className="rounded-full h-11 px-6" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Выйти
          </Button>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto border overflow-x-auto flex-nowrap">
            <TabsTrigger value="bookings"><Calendar className="w-4 h-4 mr-2" /> Записи</TabsTrigger>
            <TabsTrigger value="clients"><Users className="w-4 h-4 mr-2" /> Клиенты</TabsTrigger>
            <TabsTrigger value="services"><Scissors className="w-4 h-4 mr-2" /> Услуги</TabsTrigger>
            <TabsTrigger value="team"><Users className="w-4 h-4 mr-2" /> Команда</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
             <Card>
              <CardHeader>
                <CardTitle>Последние записи</CardTitle>
                <CardDescription>Список последних 50 бронирований.</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-16 w-full" /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Услуга</TableHead>
                        <TableHead>Мастер</TableHead>
                        <TableHead>Дата/Время</TableHead>
                        <TableHead className="text-right">Удалить</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings?.map((bk: any) => (
                        <TableRow key={bk.id}>
                          <TableCell className="font-bold">{bk.clientName}</TableCell>
                          <TableCell>{bk.serviceName}</TableCell>
                          <TableCell>{bk.barberName}</TableCell>
                          <TableCell>{bk.date} в {bk.time}</TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" onClick={() => handleDelete("bookings", bk.id)} className="hover:text-destructive">
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

          <TabsContent value="clients">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="h-fit">
                <CardHeader><CardTitle>Новый клиент</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Имя</Label><Input value={clientForm.firstName} onChange={e => setClientForm({...clientForm, firstName: e.target.value})} className="h-11" /></div>
                  <div className="space-y-2"><Label>Телефон</Label><Input value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="h-11" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="h-11" /></div>
                  <Button className="w-full h-11" onClick={handleAddClient}><UserPlus className="w-4 h-4 mr-2" /> Добавить</Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  {clientsLoading ? <Skeleton className="h-64 w-full" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Имя</TableHead><TableHead>Контакты</TableHead><TableHead className="text-right">Удалить</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {clients?.map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                              <TableCell>{c.email}<br/><span className="text-muted-foreground text-xs">{c.phone}</span></TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete("clients", c.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
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

          <TabsContent value="services">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="h-fit">
                <CardHeader><CardTitle>Добавить услугу</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Название</Label><Input value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="h-11" /></div>
                  <div className="space-y-2"><Label>Цена (₽)</Label><Input type="number" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="h-11" /></div>
                  <Button className="w-full h-11" onClick={handleAddService}><Plus className="w-4 h-4 mr-2" /> Добавить</Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  {servicesLoading ? <Skeleton className="h-64 w-full" /> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Название</TableHead><TableHead>Цена</TableHead><TableHead className="text-right">Удалить</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {services?.map((s: any) => (
                            <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{s.price} ₽</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete("services", s.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></TableCell></TableRow>
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
               <Card className="h-fit">
                <CardHeader><CardTitle>Новый мастер</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Имя</Label><Input value={newBarberName} onChange={e => setNewBarberName(e.target.value)} className="h-11" /></div>
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select value={newBarberRole} onValueChange={setNewBarberRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Топ-барбер">Топ-барбер</SelectItem>
                        <SelectItem value="Мастер">Мастер</SelectItem>
                        <SelectItem value="Барбер">Барбер</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full h-11" onClick={handleAddBarber}><Plus className="w-4 h-4 mr-2" /> Добавить</Button>
                </CardContent>
              </Card>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {barbersLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />) : (
                  barbers?.map((barber: any) => (
                    <Card key={barber.id} className="border shadow-sm">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">{barber.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">{barber.role}</span>
                            <div className="flex items-center text-xs text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-amber-500 mr-1" /> {barber.rating || 5.0} ({barber.reviewCount || 0})
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete("barbers", barber.id)} className="hover:text-destructive">
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
