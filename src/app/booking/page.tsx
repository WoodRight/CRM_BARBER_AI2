
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
import { Textarea } from "@/components/ui/textarea";
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
  UserCircle,
  Star,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { aiHairstyleTryOn } from "@/ai/flows/ai-hairstyle-try-on";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, increment } from "firebase/firestore";

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
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Данные клиента
  const [clientInfo, setClientInfo] = useState({
    name: "",
    phone: "",
    email: ""
  });

  // Отзывы
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStyle, setAiStyle] = useState("Андеркат");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    setDate(new Date());
  }, []);

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

  const handleSubmitReview = async () => {
    if (!db || !selectedBarber) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "barbers", selectedBarber.id, "reviews"), {
        clientName: clientInfo.name,
        rating: reviewRating,
        comment: reviewComment,
        createdAt: serverTimestamp()
      });
      
      const barberRef = doc(db, "barbers", selectedBarber.id);
      await updateDoc(barberRef, {
        reviewCount: increment(1)
      });
      
      setReviewSubmitted(true);
      toast({ title: "Спасибо за ваш отзыв!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ошибка", description: e.message });
    } finally {
      setIsSubmitting(false);
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
                   </div>
                   <div className="space-y-4">
                     <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">2. Желаемая прическа</p>
                     <ScrollArea className="h-[200px] border rounded-xl p-2 bg-muted/10">
                       <div className="grid grid-cols-2 gap-2">
                         {HAIRSTYLES.map(s => (
                           <Button key={s} size="sm" variant={aiStyle === s ? "default" : "outline"} className="text-[10px] h-9" onClick={() => setAiStyle(s)}>
                             {s}
                           </Button>
                         ))}
                       </div>
                     </ScrollArea>
                     <Button onClick={handleAiVisualize} disabled={aiLoading || !photo} className="w-full h-12 bg-accent font-bold">
                       {aiLoading ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                       {aiLoading ? "Создаем образ..." : "Примерить стиль"}
                     </Button>
                   </div>
                 </div>
                 {aiGeneratedImage && (
                   <div className="mt-8 pt-8 border-t border-border text-center animate-in zoom-in-95">
                     <p className="text-sm font-bold mb-4 flex items-center justify-center gap-2 text-green-500"><CheckCircle2 className="w-5 h-5" /> Образ готов</p>
                     <div className="relative aspect-square max-w-[320px] mx-auto rounded-2xl overflow-hidden shadow-2xl">
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
                Array(3).fill(0).map((_, i) => <Skeleton className="h-20 w-full rounded-xl" />)
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
                      <div className="w-16 h-16 rounded-full overflow-hidden relative border-2 border-background">
                        <Image src={`https://picsum.photos/seed/${b.id}/150/150`} fill alt={b.name} className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{b.name}</h3>
                          <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-extrabold uppercase">{b.role || "Барбер"}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                           <div className="flex items-center text-amber-500 font-bold text-sm">
                             <Star className="w-3 h-3 fill-amber-500 mr-1" /> {b.rating || 5.0}
                           </div>
                           <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                             <MessageSquare className="w-3 h-3" /> {b.reviewCount || 0} отзывов
                           </div>
                        </div>
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
            <h2 className="text-3xl font-headline font-bold text-center">Когда вам удобно?</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <h3 className="font-bold flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Дата</h3>
                 <Card className="p-4"><Calendar mode="single" selected={date} onSelect={(d) => setDate(d || date)} locale={ru} disabled={{ before: new Date() }} className="mx-auto" /></Card>
               </div>
               <div className="space-y-4">
                 <h3 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> Время</h3>
                 <ScrollArea className="h-[300px] border rounded-xl p-4 bg-muted/5">
                   <div className="grid grid-cols-3 gap-2">
                     {TIME_SLOTS.map(t => (
                       <Button key={t} variant={selectedTime === t ? "default" : "outline"} onClick={() => setSelectedTime(t)} className="h-12 font-bold">{t}</Button>
                     ))}
                   </div>
                 </ScrollArea>
               </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="text-center space-y-2">
                <h2 className="text-3xl font-headline font-bold">Ваши контакты</h2>
                <p className="text-muted-foreground">Для подтверждения записи</p>
             </div>
             <Card className="max-w-xl mx-auto shadow-xl overflow-hidden rounded-[2rem]">
               <CardContent className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Имя</Label>
                      <Input placeholder="Александр" value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Телефон</Label>
                      <Input placeholder="+7..." value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                 </div>
                 <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 text-sm space-y-2">
                    <p className="font-bold text-primary uppercase text-[10px]">Резюме:</p>
                    <div className="flex justify-between font-medium"><span>{selectedService?.name}</span><span>{selectedService?.price} ₽</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>{date && format(date, 'd MMMM', { locale: ru })} в {selectedTime}</span><span>{selectedBarber?.name}</span></div>
                 </div>
               </CardContent>
             </Card>
          </div>
        );
      case 6:
        return (
          <div className="max-w-2xl mx-auto space-y-8 text-center animate-in zoom-in-95">
            <div className="bg-card rounded-[2.5rem] p-12 shadow-2xl border">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-4xl font-headline font-bold mb-4">Запись создана!</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Ждем вас <strong>{date && format(date, 'd MMMM', { locale: ru })}</strong> в <strong>{selectedTime}</strong>.
              </p>
              
              {!reviewSubmitted ? (
                <div className="mt-12 pt-12 border-t space-y-6 text-left">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Оставьте отзыв мастеру</h3>
                  <div className="space-y-4">
                    <div className="flex justify-center gap-4 py-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={cn("w-10 h-10 cursor-pointer transition-all", star <= reviewRating ? "fill-amber-500 text-amber-500 scale-110" : "text-muted-foreground hover:text-amber-500")}
                          onClick={() => setReviewRating(star)}
                        />
                      ))}
                    </div>
                    <Textarea 
                      placeholder="Расскажите о своих впечатлениях..." 
                      value={reviewComment} 
                      onChange={e => setReviewComment(e.target.value)}
                      className="min-h-[100px] rounded-2xl"
                    />
                    <Button 
                      className="w-full h-12 rounded-xl bg-accent font-bold" 
                      onClick={handleSubmitReview} 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Отправить отзыв"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 p-6 bg-green-500/10 rounded-2xl text-green-600 font-bold animate-in fade-in">
                  Спасибо! Ваш отзыв поможет другим клиентам.
                </div>
              )}
              
              <div className="mt-8">
                <Link href="/"><Button variant="ghost" className="rounded-full">На главную</Button></Link>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const handleConfirm = async () => {
    if (!selectedTime || !date || !db) return;
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
            <div className="flex justify-between items-end mb-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
               <span>Шаг {step} из 5</span>
               <span className="text-primary">{Math.round((step / 5) * 100)}%</span>
            </div>
            <Progress value={(step / 5) * 100} className="h-1.5" />
          </div>
        )}
        <div className="min-h-[500px]">{renderStep()}</div>
        {step < 6 && (
          <div className="mt-12 flex justify-between items-center border-t pt-8">
            <Button variant="ghost" className="rounded-full px-8 h-12 font-bold" onClick={() => setStep(s => s - 1)} disabled={step === 1}><ArrowLeft className="w-4 h-4 mr-2" /> Назад</Button>
            {step < 5 ? (
              <Button className="rounded-full px-10 h-12 bg-primary font-bold" onClick={handleNextStep}>Далее <ArrowRight className="w-4 h-4 ml-2" /></Button>
            ) : (
              <Button className="rounded-full px-12 h-14 bg-green-600 font-bold" onClick={handleNextStep} disabled={isSubmitting || !clientInfo.name || !clientInfo.phone}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : "Подтвердить запись"}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
