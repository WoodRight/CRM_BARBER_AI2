"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Scissors, 
  Settings, 
  Search, 
  UserPlus, 
  MoreVertical,
  Clock,
  DollarSign,
  Briefcase
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MOCK_BOOKINGS = [
  { id: "BK-001", client: "Иван Иванов", service: "Фирменная стрижка", barber: "Алекс Риверс", date: "2024-05-20", time: "10:00", status: "Подтверждено", total: "2500 ₽" },
  { id: "BK-002", client: "Михаил Кузнецов", service: "Полный комплекс", barber: "Сара Чен", date: "2024-05-20", time: "11:30", status: "В процессе", total: "3500 ₽" },
  { id: "BK-003", client: "Давид Вильсон", service: "Скульптура бороды", barber: "Маркус Торн", date: "2024-05-20", time: "13:00", status: "Ожидание", total: "1500 ₽" },
  { id: "BK-004", client: "Дмитрий Петров", service: "Детская стрижка", barber: "Алекс Риверс", date: "2024-05-21", time: "09:00", status: "Подтверждено", total: "1200 ₽" },
];

const MOCK_CLIENTS = [
  { id: "CL-001", name: "Иван Иванов", email: "ivan@example.com", phone: "+7 900 123 4567", lastVisit: "2024-04-15", totalSpent: "12500 ₽", loyalty: "Платина" },
  { id: "CL-002", name: "Михаил Кузнецов", email: "mike@example.com", phone: "+7 911 222 3344", lastVisit: "2024-05-01", totalSpent: "8500 ₽", loyalty: "Золото" },
  { id: "CL-003", name: "Давид Вильсон", email: "david@example.com", phone: "+7 955 666 7788", lastVisit: "2024-05-18", totalSpent: "1500 ₽", loyalty: "Стандарт" },
];

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Панель <span className="text-accent">Администратора</span></h1>
            <p className="text-muted-foreground">Управляйте бизнесом, клиентами и командой в одном месте.</p>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-full bg-primary">
              <UserPlus className="w-4 h-4 mr-2" /> Добавить клиента
            </Button>
            <Button variant="outline" className="rounded-full border-border">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Выручка за день", value: "45,000 ₽", icon: DollarSign, trend: "+12.5%", color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Активные записи", value: "24", icon: Calendar, trend: "+3 за неделю", color: "text-accent", bg: "bg-accent/10" },
            { label: "Новые клиенты", value: "12", icon: Users, trend: "+5 сегодня", color: "text-primary", bg: "bg-primary/10" },
            { label: "Средний чек", value: "2,800 ₽", icon: TrendingUp, trend: "+8.2%", color: "text-amber-500", bg: "bg-amber-500/10" },
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
          <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto overflow-x-auto inline-flex whitespace-nowrap scrollbar-hide">
            <TabsTrigger value="bookings" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" /> Записи
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Клиенты (CRM)
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-2" /> Управление мастерами
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Scissors className="w-4 h-4 mr-2" /> Услуги
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <Card className="border-border shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                  <CardTitle>Предстоящие визиты</CardTitle>
                  <CardDescription>Просмотр и управление расписанием на сегодня и завтра.</CardDescription>
                </div>
                <div className="relative w-full max-w-sm hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Поиск записей..." 
                    className="pl-10 rounded-full bg-muted/50" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Услуга</TableHead>
                      <TableHead>Мастер</TableHead>
                      <TableHead>Время</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_BOOKINGS.map((bk) => (
                      <TableRow key={bk.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-xs text-muted-foreground">{bk.id}</TableCell>
                        <TableCell className="font-bold">{bk.client}</TableCell>
                        <TableCell>{bk.service}</TableCell>
                        <TableCell>{bk.barber}</TableCell>
                        <TableCell>{bk.time}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs font-semibold",
                              bk.status === "Подтверждено" ? "bg-green-500/10 text-green-500" : 
                              bk.status === "В процессе" ? "bg-accent/10 text-accent" : "bg-amber-500/10 text-amber-500"
                            )}
                          >
                            {bk.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{bk.total}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
             <Card className="border-border shadow-md">
              <CardHeader>
                <CardTitle>База клиентов</CardTitle>
                <CardDescription>Детальные профили и история каждого клиента.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя клиента</TableHead>
                      <TableHead>Лояльность</TableHead>
                      <TableHead>Контакт</TableHead>
                      <TableHead>Последний визит</TableHead>
                      <TableHead>LTV</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_CLIENTS.map((cl) => (
                      <TableRow key={cl.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {cl.name.charAt(0)}
                            </div>
                            <span className="font-bold">{cl.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-accent text-accent">{cl.loyalty}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{cl.phone}</TableCell>
                        <TableCell>{cl.lastVisit}</TableCell>
                        <TableCell className="font-bold text-green-500">{cl.totalSpent}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-primary font-semibold">История</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Алекс Риверс", role: "Топ-барбер", bookings: 124, rating: 4.9, status: "Активен" },
              { name: "Сара Чен", role: "Старший стилист", bookings: 98, rating: 5.0, status: "Активна" },
              { name: "Маркус Торн", role: "Барбер-эксперт", bookings: 45, rating: 4.7, status: "Перерыв" },
            ].map((barber, i) => (
              <Card key={i} className="border-border bg-card overflow-hidden">
                <div className="h-2 bg-primary"></div>
                <CardContent className="p-6">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden relative border border-border">
                        <img src={`https://picsum.photos/seed/${barber.name}/100/100`} alt={barber.name} />
                     </div>
                     <div>
                       <h3 className="font-bold text-lg">{barber.name}</h3>
                       <p className="text-sm text-muted-foreground">{barber.role}</p>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-muted/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-muted-foreground mb-1">Записи</p>
                        <p className="font-bold">{barber.bookings}</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-muted-foreground mb-1">Рейтинг</p>
                        <p className="font-bold text-accent">★ {barber.rating}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                     <Button variant="outline" className="flex-1 rounded-lg text-xs">Расписание</Button>
                     <Button className="rounded-lg bg-primary w-10 p-0"><Settings className="w-4 h-4" /></Button>
                   </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-2 border-dashed border-border bg-transparent flex items-center justify-center p-12 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
               <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-bold text-sm">Добавить мастера</p>
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="services">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Фирменная стрижка", price: 2500, duration: 45, color: "text-blue-500" },
                  { name: "Скульптура бороды", price: 1500, duration: 30, color: "text-purple-500" },
                  { name: "Полный комплекс", price: 3500, duration: 75, color: "text-accent" },
                  { name: "Бритье горячим полотенцем", price: 1200, duration: 25, color: "text-orange-500" },
                  { name: "Окрашивание волос", price: 3000, duration: 90, color: "text-pink-500" },
                ].map((s, i) => (
                  <Card key={i} className="bg-card border-border hover:border-accent transition-colors cursor-pointer group">
                    <CardContent className="p-6">
                       <div className="flex justify-between items-start mb-6">
                         <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                           <Scissors className={`w-6 h-6 ${s.color}`} />
                         </div>
                         <div className="text-right">
                           <p className="text-2xl font-bold text-primary">{s.price} ₽</p>
                           <p className="text-xs text-muted-foreground">{s.duration} мин</p>
                         </div>
                       </div>
                       <h3 className="font-headline font-bold text-lg mb-2">{s.name}</h3>
                       <p className="text-sm text-muted-foreground mb-4">Премиальный уход, подобранный под ваш стиль.</p>
                       <div className="flex gap-2">
                         <Button variant="ghost" size="sm" className="rounded-lg text-xs">Изменить</Button>
                         <Button variant="ghost" size="sm" className="rounded-lg text-xs text-destructive">Отключить</Button>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
