"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { collection, query, orderBy } from "firebase/firestore";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Scissors, 
  Settings, 
  Clock,
  DollarSign,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const bookingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "bookings"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = () => {
    if (auth) signOut(auth);
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
            <Button variant="outline" className="rounded-full border-border" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Выйти
            </Button>
            <Button className="rounded-full bg-primary">
              <Settings className="w-4 h-4 mr-2" /> Настройки
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Всего записей", value: bookings?.length || 0, icon: Calendar, trend: "+12%", color: "text-accent", bg: "bg-accent/10" },
            { label: "Выручка", value: `${totalRevenue} ₽`, icon: DollarSign, trend: "Факт", color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Клиентов", value: bookings?.length || 0, icon: Users, trend: "Уникальные", color: "text-primary", bg: "bg-primary/10" },
            { label: "Рейтинг", value: "4.9", icon: TrendingUp, trend: "Топ", color: "text-amber-500", bg: "bg-amber-500/10" },
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
            <TabsTrigger value="team">Команда</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>История бронирования</CardTitle>
                <CardDescription>Все активные записи из базы данных в реальном времени.</CardDescription>
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
                        </TableRow>
                      ))}
                      {bookings?.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Записей пока нет</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Алекс Риверс", role: "Топ-барбер", rating: 4.9 },
                { name: "Сара Чен", role: "Старший стилист", rating: 5.0 },
              ].map((barber, i) => (
                <Card key={i}>
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 overflow-hidden relative">
                      <img src={`https://picsum.photos/seed/${barber.name}/100/100`} alt={barber.name} className="object-cover" />
                    </div>
                    <h3 className="font-bold">{barber.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{barber.role}</p>
                    <Badge variant="outline">★ {barber.rating}</Badge>
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
