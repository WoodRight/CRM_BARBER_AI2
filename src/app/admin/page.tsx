
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, serverTimestamp, doc } from "firebase/firestore";
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
  Plus,
  Trash2,
  UserPlus,
  Star,
  LayoutDashboard,
  UserCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
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

  // Оптимизированные запросы: запускаются только когда пользователь авторизован
  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(50));
  }, [db, user, isUserLoading]);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, "clients"), orderBy("firstName", "asc"));
  }, [db, user, isUserLoading]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, "services"), orderBy("createdAt", "desc"));
  }, [db, user, isUserLoading]);

  const barbersQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, "barbers"), orderBy("createdAt", "desc"));
  }, [db, user, isUserLoading]);

  const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);
  const { data: barbers, isLoading: barbersLoading } = useCollection(barbersQuery);
  const { data: clients, isLoading: clientsLoading } = useCollection(clientsQuery);

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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 bg-card p-8 rounded-[2rem] border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight">Рабочая <span className="text-primary">Область</span></h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              Управление заказами, командой и клиентами.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="bookings" className="space-y-8">
        <div className="flex justify-start">
          <TabsList className="bg-card p-1.5 rounded-2xl border border-border shadow-sm flex-nowrap scrollbar-hide">
            <TabsTrigger value="bookings" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Calendar className="w-4 h-4 mr-2" /> Записи
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Users className="w-4 h-4 mr-2" /> Клиенты
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Scissors className="w-4 h-4 mr-2" /> Услуги
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <UserCircle className="w-4 h-4 mr-2" /> Команда
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bookings" className="animate-in fade-in slide-in-from-bottom-4">
           <Card className="rounded-[2rem] border-border shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border p-8">
              <CardTitle className="text-2xl">Ближайшие визиты</CardTitle>
              <CardDescription>Актуальный список записей на сегодня.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {bookingsLoading ? <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/10">
                      <TableHead className="py-5 px-8">Клиент</TableHead>
                      <TableHead>Услуга</TableHead>
                      <TableHead>Мастер</TableHead>
                      <TableHead>Время</TableHead>
                      <TableHead className="text-right px-8">Удалить</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.map((bk: any) => (
                      <TableRow key={bk.id} className="hover:bg-muted/5">
                        <TableCell className="font-bold py-5 px-8">
                          <div className="flex flex-col">
                            <span>{bk.clientName}</span>
                            <span className="text-[10px] text-muted-foreground">{bk.clientPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell><span className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/10">{bk.serviceName}</span></TableCell>
                        <TableCell className="text-muted-foreground">{bk.barberName}</TableCell>
                        <TableCell><span className="font-bold">{bk.date}</span> <span className="text-accent font-bold ml-1">{bk.time}</span></TableCell>
                        <TableCell className="text-right px-8">
                           <Button variant="ghost" size="icon" onClick={() => handleDelete("bookings", bk.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-full"><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!bookings || bookings.length === 0) && !bookingsLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">Записей пока нет</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="h-fit rounded-[2rem] border-border shadow-lg">
              <CardHeader className="p-8"><CardTitle className="text-xl">Новый клиент</CardTitle></CardHeader>
              <CardContent className="p-8 pt-0 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Имя</Label>
                  <Input placeholder="Александр" value={clientForm.firstName} onChange={e => setClientForm({...clientForm, firstName: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Телефон</Label>
                  <Input placeholder="+7..." value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <Button className="w-full h-12 rounded-xl font-bold" onClick={handleAddClient}>Добавить</Button>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 rounded-[2rem] border-border shadow-lg overflow-hidden">
              <CardContent className="p-0">
                {clientsLoading ? <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /></div> : (
                  <Table>
                    <TableHeader><TableRow className="bg-muted/10"><TableHead className="py-5 px-8">Имя клиента</TableHead><TableHead>Контакты</TableHead><TableHead className="text-right px-8">Удалить</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {clients?.map((c: any) => (
                          <TableRow key={c.id} className="hover:bg-muted/5">
                            <TableCell className="font-bold py-5 px-8">{c.firstName} {c.lastName}</TableCell>
                            <TableCell>{c.phone}</TableCell>
                            <TableCell className="text-right px-8"><Button variant="ghost" size="icon" onClick={() => handleDelete("clients", c.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-full"><Trash2 className="w-4 h-4" /></Button></TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="h-fit rounded-[2rem] border-border shadow-lg">
              <CardHeader className="p-8"><CardTitle className="text-xl">Новая услуга</CardTitle></CardHeader>
              <CardContent className="p-8 pt-0 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Название</Label>
                  <Input placeholder="Стрижка бороды" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Цена (₽)</Label>
                  <Input type="number" placeholder="1500" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <Button className="w-full h-12 rounded-xl font-bold" onClick={handleAddService}>Добавить</Button>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 rounded-[2rem] border-border shadow-lg overflow-hidden">
              <CardContent className="p-0">
                {servicesLoading ? <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /></div> : (
                  <Table>
                    <TableHeader><TableRow className="bg-muted/10"><TableHead className="py-5 px-8">Название</TableHead><TableHead>Стоимость</TableHead><TableHead className="text-right px-8">Удалить</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {services?.map((s: any) => (
                          <TableRow key={s.id} className="hover:bg-muted/5">
                            <TableCell className="font-bold py-5 px-8">{s.name}</TableCell>
                            <TableCell><span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold">{s.price} ₽</span></TableCell>
                            <TableCell className="text-right px-8"><Button variant="ghost" size="icon" onClick={() => handleDelete("services", s.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-full"><Trash2 className="w-4 h-4" /></Button></TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="animate-in fade-in slide-in-from-bottom-4">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <Card className="h-fit rounded-[2rem] border-border shadow-lg">
              <CardHeader className="p-8"><CardTitle className="text-xl">Новый мастер</CardTitle></CardHeader>
              <CardContent className="p-8 pt-0 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Имя мастера</Label>
                  <Input placeholder="Иван" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Категория</Label>
                  <Select value={newBarberRole} onValueChange={setNewBarberRole}>
                    <SelectTrigger className="h-12 rounded-xl border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Топ-барбер">Топ-барбер</SelectItem>
                      <SelectItem value="Мастер">Мастер</SelectItem>
                      <SelectItem value="Барбер">Барбер</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold" onClick={handleAddBarber}>Добавить</Button>
              </CardContent>
            </Card>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {barbersLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />) : (
                barbers?.map((barber: any) => (
                  <Card key={barber.id} className="rounded-[2rem] border border-border shadow-sm hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-full overflow-hidden border-2 border-background shadow-sm">
                          <img src={`https://picsum.photos/seed/${barber.id}/150/150`} alt={barber.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{barber.name}</h3>
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase w-fit">{barber.role}</span>
                            <div className="flex items-center text-xs text-amber-500 font-bold"><Star className="w-3 h-3 fill-amber-500 mr-1" /> {barber.rating || 5.0}</div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete("barbers", barber.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-full"><Trash2 className="w-4 h-4" /></Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
