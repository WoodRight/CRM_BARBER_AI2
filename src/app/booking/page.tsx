"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Upload,
  User,
  ImageIcon,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  UserCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { aiHairstyleTryOn } from "@/ai/flows/ai-hairstyle-try-on";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00"
];

const HAIRSTYLES = [
  "Бокс", "Фейд", "Классический Помпадур", "Текстурированный Квифф", 
  "Пробор на бок", "Мужской пучок", "Андеркат", "Афро", "Дреды", "Тейпер"
];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Данные клиента
  const [clientInfo, setClientInfo] = useState({
    name: "",
    phone: "",
    email: ""
  });

  const [photo, setPhoto] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStyle, setAiStyle] = useState("Андеркат");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const db = useFirestore();

  // Загрузка услуг и мастеров из БД
  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "services"), orderBy("price", "asc"));
  }, [db]);

  const barbersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "barbers"), orderBy("name", "asc"));
  }, [db]);

  const { data: services, isLoading: servicesLoading } = useCollection(servicesQuery);
  const { data: barbers, isLoading: barbersLoading } = useCollection(barbersQuery);

  const handleNextStep = () => {
    if (step === 1 && !selectedService) return toast({ variant: "destructive", title: "Выберите услугу" });
    if (step === 3 && !selectedBarber) return toast({ variant: "destructive", title: "Выберите мастера" });
    if (step === 4 && (!date || !selectedTime)) return toast({ variant: "destructive", title: "Выберите дату и время" });
    if (step === 5) {
      if (!clientInfo.name.trim()) return toast({ variant: "destructive", title: "Введите ваше имя" });
      if (!clientInfo.phone.trim()) return toast({ variant: "destructive", title: "Введите номер телефона" });
      handleConfirm();
      return;
    }
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setAiGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiVisualize = async () => {
    if (!photo || !aiStyle) return toast({ variant: "destructive", title: "Загрузите фото и выберите стиль" });
    setAiLoading(true);
    try {
      const result = await aiHairstyleTryOn({ photoDataUri: photo, hairstyleDescription: aiStyle });
      setAiGeneratedImage(result.generatedHairstyleImage);
      toast({ title: "Визуализация готова!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Ошибка ИИ", description: err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold">Выберите услугу</h2>
            <div className="grid gap-4">
              {servicesLoading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
              ) : (
                services?.map((s) => (
                  <Card 
                    key={s.id} 
                    className={cn(
                      "cursor-pointer border-2 transition-all duration-300", 
                      selectedService?.id === s.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedService(s)}
                  >
                    <CardContent className="p-6 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{s.name}</h3>
                        <div className="flex gap-4 items-center mt-1">
                          <p className="text-primary font-bold">{s.price} ₽</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {s.durationMinutes} мин</p>
                        </div>
                      </div>
                      {selectedService?.id === s.id && <CheckCircle2 className="text-primary" />}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-headline font-bold flex items-center gap-2"><Sparkles className="text-accent" /> ИИ-стилист</h2>
                <Button variant="ghost" className="text-muted-foreground" onClick={() => setStep(3)}>Пропустить</Button>
             </div>
             <Card className="overflow-hidden border-border shadow-lg">
               <CardContent className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                     <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">1. Ваше фото</p>
                     <div 
                       className={cn(
                         "relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-muted/20",
                         photo ? "border-primary/40 bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
                       )}
                       onClick={() => fileInputRef.current?.click()}
                     >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        {photo ? (
                          <Image src={photo} fill alt="Input" className="object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <span className="text-xs font-semibold">Нажмите для загрузки</span>
                          </div>
                        )}
                     </div>
                     <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-[10px]"
                      onClick={() => setPhoto(PlaceHolderImages.find(i=>i.id==="sample-man-portrait")?.imageUrl || null)}
                     >
                       <ImageIcon className="w-3 h-3 mr-1" /> Использовать пример
                     </Button>
                   </div>

                   <div className="space-y-4">
                     <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">2. Желаемая прическа</p>
                     <ScrollArea className="h-[200px] border rounded-xl p-2 bg-muted/10">
                       <div className="grid grid-cols-2 gap-2">
                         {HAIRSTYLES.map(s => (
                           <Button 
                            key={s} 
                            size="sm" 
                            variant={aiStyle === s ? "default" : "outline"} 
                            className="text-[10px] h-9 rounded-lg"
                            onClick={() => setAiStyle(s)}
                           >
                             {s}
                           </Button>
                         ))}
                       </div>
                     </ScrollArea>
                     <Button 
                      onClick={handleAiVisualize} 
                      disabled={aiLoading || !photo} 
                      className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold"
                     >
                       {aiLoading ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                       {aiLoading ? "Создаем образ..." : "Примерить стиль"}
                     </Button>
                   </div>
                 </div>

                 {aiGeneratedImage && (
                   <div className="mt-8 pt-8 border-t border-border text-center">
                     <p className="text-sm font-bold mb-4 flex items-center justify-center gap-2">
                       <CheckCircle2 className="text-green-500 w-5 h-5" /> Ваш новый образ готов
                     </p>
                     <div className="relative aspect-square max-w-[320px] mx-auto rounded-2xl overflow-hidden border-4 border-card shadow-2xl">
                       <Image src={aiGeneratedImage} fill alt="Result" className="object-cover" />
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold">Выберите мастера</h2>
            <div className="grid gap-4">
              {barbersLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
              ) : (
                barbers?.map((b) => (
                  <Card 
                    key={b.id} 
                    className={cn(
                      "cursor-pointer border-2 transition-all duration-300", 
                      selectedBarber?.id === b.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
                    )} 
                    onClick={() => setSelectedBarber(b)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden relative border-2 border-background">
                        <Image src={b.profileImageUrl || `https://picsum.photos/seed/${b.id}/100/100`} fill alt={b.name} className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{b.name}</h3>
                        <p className="text-xs text-muted-foreground">{b.role || "Мастер"}</p>
                      </div>
                      {selectedBarber?.id === b.id && <CheckCircle2 className="text-primary w-6 h-6" />}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-headline font-bold text-center mb-8">Когда вам удобно?</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               <div className="lg:col-span-7 space-y-6">
                 <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">1. Выберите дату</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Доступно на 30 дней вперед</p>
                    </div>
                 </div>
                 
                 <div className="border border-border/60 rounded-[2rem] p-6 bg-card shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={(newDate) => setDate(newDate || date)} 
                      locale={ru}
                      disabled={{ before: new Date() }}
                      className="rounded-md w-full flex justify-center scale-110 py-4" 
                    />
                 </div>
               </div>

               <div className="lg:col-span-5 space-y-6">
                 <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">2. Выберите время</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Рабочие часы: 09:00 - 20:00</p>
                    </div>
                 </div>

                 <ScrollArea className="h-[420px] pr-4 border border-border/60 rounded-[2rem] p-6 bg-muted/5 shadow-inner">
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {TIME_SLOTS.map(t => (
                       <Button 
                        key={t} 
                        variant={selectedTime === t ? "default" : "outline"} 
                        onClick={() => setSelectedTime(t)} 
                        className={cn(
                          "h-14 text-sm font-bold rounded-2xl transition-all duration-300", 
                          selectedTime === t 
                            ? "bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-4 ring-offset-background" 
                            : "bg-background hover:bg-muted hover:border-primary/50"
                        )}
                       >
                         {t}
                       </Button>
                     ))}
                   </div>
                 </ScrollArea>
               </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center space-y-2">
                <h2 className="text-3xl font-headline font-bold">Ваши контакты</h2>
                <p className="text-muted-foreground">Оставьте данные, чтобы мы могли подтвердить запись</p>
             </div>
             
             <Card className="max-w-xl mx-auto shadow-2xl border-primary/10 overflow-hidden rounded-[2.5rem]">
               <CardContent className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2 text-sm font-bold ml-1">
                        <UserCircle className="w-4 h-4 text-primary" /> Ваше имя
                      </Label>
                      <Input 
                        id="name"
                        placeholder="Александр" 
                        value={clientInfo.name}
                        onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                        className="h-14 rounded-2xl border-muted bg-muted/20 focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-bold ml-1">
                        <Phone className="w-4 h-4 text-primary" /> Телефон
                      </Label>
                      <Input 
                        id="phone"
                        type="tel"
                        placeholder="+7 (___) ___-__-__" 
                        value={clientInfo.phone}
                        onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                        className="h-14 rounded-2xl border-muted bg-muted/20 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-sm font-bold ml-1">
                        <Mail className="w-4 h-4 text-primary" /> Email (опционально)
                      </Label>
                      <Input 
                        id="email"
                        type="email"
                        placeholder="mail@example.com" 
                        value={clientInfo.email}
                        onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                        className="h-14 rounded-2xl border-muted bg-muted/20 focus:ring-primary"
                      />
                    </div>
                 </div>

                 <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-2">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Резюме записи:</p>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground">{selectedService?.name}</span>
                       <span className="font-bold">{selectedService?.price} ₽</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground">{format(date!, 'd MMMM', { locale: ru })} в {selectedTime}</span>
                       <span className="font-bold">{selectedBarber?.name}</span>
                    </div>
                 </div>
               </CardContent>
             </Card>
          </div>
        );
      case 6:
        return (
          <div className="text-center py-16 px-6 bg-card rounded-[2rem] border border-border shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-4xl font-headline font-bold mb-4">Готово!</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-sm mx-auto">
              <span className="font-bold text-foreground">{clientInfo.name}</span>, мы ждем вас <span className="text-foreground font-bold">{date && format(date, 'd MMMM', { locale: ru })}</span> в <span className="text-foreground font-bold">{selectedTime}</span>.
            </p>
            <Link href="/"><Button className="rounded-full px-12 h-14 text-lg font-bold">Вернуться на главную</Button></Link>
          </div>
        );
      default: return null;
    }
  };

  const handleConfirm = async () => {
    if (!selectedTime || !date || !db) return toast({ variant: "destructive", title: "Выберите дату и время" });
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        clientName: clientInfo.name, 
        clientPhone: clientInfo.phone,
        clientEmail: clientInfo.email,
        serviceName: selectedService.name,
        barberName: selectedBarber.name,
        date: format(date, "yyyy-MM-dd"),
        time: selectedTime,
        status: "confirmed",
        totalPrice: selectedService.price,
        aiResultUrl: aiGeneratedImage || null,
        createdAt: serverTimestamp()
      });
      setStep(6);
      toast({ title: "Запись подтверждена!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ошибка", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        {step < 6 && (
          <div className="mb-12">
            <div className="flex justify-between items-end mb-4">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Шаг {step} из 5</p>
               <p className="text-sm font-bold text-primary">{Math.round((step / 5) * 100)}%</p>
            </div>
            <Progress value={(step / 5) * 100} className="h-1.5" />
          </div>
        )}
        
        <div className="min-h-[500px]">
          {renderStep()}
        </div>

        {step < 6 && (
          <div className="mt-12 flex justify-between items-center border-t border-border pt-8">
            <Button 
              variant="ghost" 
              className="rounded-full px-8 h-12 font-bold" 
              onClick={() => setStep(s => s - 1)} 
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Назад
            </Button>
            {step < 5 ? (
              <Button 
                className="rounded-full px-10 h-12 bg-primary hover:bg-primary/90 font-bold" 
                onClick={handleNextStep}
              >
                Далее <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                className="rounded-full px-12 h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-500/20" 
                onClick={handleNextStep} 
                disabled={isSubmitting || !clientInfo.name || !clientInfo.phone}
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : null}
                {isSubmitting ? "Бронируем..." : "Подтвердить запись"}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
