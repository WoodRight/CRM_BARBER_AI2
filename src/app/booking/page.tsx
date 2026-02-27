
"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Upload,
  User,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { aiHairstyleTryOn } from "@/ai/flows/ai-hairstyle-try-on";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const SERVICES = [
  { id: 1, name: "Фирменная стрижка", price: 2500, duration: "45 мин" },
  { id: 2, name: "Борода", price: 1500, duration: "30 мин" },
  { id: 3, name: "Полный комплекс", price: 3500, duration: "75 мин" },
];

const BARBERS = [
  { id: 1, name: "Алекс Риверс", role: "Топ-барбер", img: "https://picsum.photos/seed/alex/100/100" },
  { id: 2, name: "Сара Чен", role: "Старший стилист", img: "https://picsum.photos/seed/sarah/100/100" },
];

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

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
  
  const [photo, setPhoto] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStyle, setAiStyle] = useState("Андеркат");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const db = useFirestore();

  const handleNextStep = () => {
    if (step === 1 && !selectedService) return toast({ variant: "destructive", title: "Выберите услугу" });
    if (step === 3 && !selectedBarber) return toast({ variant: "destructive", title: "Выберите мастера" });
    setStep(prev => prev + 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Файл слишком большой", description: "Максимальный размер 5 МБ." });
        return;
      }
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
              {SERVICES.map((s) => (
                <Card 
                  key={s.id} 
                  className={cn("cursor-pointer border-2 transition-all", selectedService?.id === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
                  onClick={() => setSelectedService(s)}
                >
                  <CardContent className="p-6 flex justify-between items-center">
                    <div><h3 className="font-bold text-lg">{s.name}</h3><p className="text-primary font-bold">{s.price} ₽</p></div>
                    {selectedService?.id === s.id && <CheckCircle2 className="text-primary" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-headline font-bold flex items-center gap-2"><Sparkles className="text-accent" /> ИИ-стилист</h2>
                <Button variant="ghost" onClick={() => setStep(3)}>Пропустить</Button>
             </div>
             <Card className="overflow-hidden border-border shadow-lg">
               <CardContent className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <p className="text-sm font-medium text-muted-foreground">1. Загрузите портрет</p>
                     <div 
                       className={cn(
                         "relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden",
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
                            <span className="text-xs">Нажмите для загрузки</span>
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
                     <p className="text-sm font-medium text-muted-foreground">2. Выберите прическу</p>
                     <ScrollArea className="h-[200px] border rounded-md p-2">
                       <div className="grid grid-cols-2 gap-2">
                         {HAIRSTYLES.map(s => (
                           <Button 
                            key={s} 
                            size="sm" 
                            variant={aiStyle === s ? "default" : "outline"} 
                            className="text-[10px] h-8"
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
                      className="w-full bg-accent hover:bg-accent/90"
                     >
                       {aiLoading ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                       {aiLoading ? "Генерация..." : "Примерить стиль"}
                     </Button>
                   </div>
                 </div>

                 {aiGeneratedImage && (
                   <div className="mt-6 pt-6 border-t border-border">
                     <p className="text-center text-sm font-bold mb-4 flex items-center justify-center gap-2">
                       <CheckCircle2 className="text-green-500 w-4 h-4" /> Ваш новый образ готов
                     </p>
                     <div className="relative aspect-square max-w-[300px] mx-auto rounded-2xl overflow-hidden border-4 border-card shadow-2xl">
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
              {BARBERS.map((b) => (
                <Card key={b.id} className={cn("cursor-pointer border-2 transition-all", selectedBarber?.id === b.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")} onClick={() => setSelectedBarber(b)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden relative"><Image src={b.img} fill alt={b.name} className="object-cover" /></div>
                    <div className="flex-1 font-bold">{b.name}</div>
                    {selectedBarber?.id === b.id && <CheckCircle2 className="text-primary" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold">Дата и время</h2>
            <div className="grid md:grid-cols-2 gap-8">
               <Calendar mode="single" selected={date} onSelect={setDate} locale={ru} className="border rounded-xl bg-card" />
               <div className="grid grid-cols-2 gap-2 content-start">
                 {TIME_SLOTS.map(t => (
                   <Button key={t} variant={selectedTime === t ? "default" : "outline"} onClick={() => setSelectedTime(t)} className="h-12">{t}</Button>
                 ))}
               </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center py-10 bg-card rounded-2xl border border-border shadow-xl">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-headline font-bold mb-2">Запись готова!</h2>
            <p className="text-muted-foreground mb-6">Мы ждем вас {date && format(date, 'd MMMM', { locale: ru })} в {selectedTime}.</p>
            <Link href="/"><Button className="rounded-full px-10 h-12 text-lg">На главную</Button></Link>
          </div>
        );
      default: return null;
    }
  };

  const handleConfirm = async () => {
    if (!selectedTime || !db) return toast({ variant: "destructive", title: "Выберите время" });
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        clientName: "Гость", 
        serviceName: selectedService.name,
        barberName: selectedBarber.name,
        date: format(date!, "yyyy-MM-dd"),
        time: selectedTime,
        status: "confirmed",
        totalPrice: selectedService.price,
        aiResultUrl: aiGeneratedImage || null,
        createdAt: serverTimestamp()
      });
      setStep(5);
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
      <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        {step < 5 && (
          <div className="mb-10">
            <Progress value={(step / 4) * 100} className="h-2 mb-4" />
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">
              <span>Услуга</span><span>ИИ</span><span>Мастер</span><span>Время</span>
            </div>
          </div>
        )}
        {renderStep()}
        {step < 5 && (
          <div className="mt-10 flex justify-between items-center border-t border-border pt-6">
            <Button variant="outline" className="rounded-full px-6" onClick={() => setStep(s => s - 1)} disabled={step === 1}>Назад</Button>
            {step < 4 ? (
              <Button className="rounded-full px-8 bg-primary hover:bg-primary/90" onClick={handleNextStep}>Далее</Button>
            ) : (
              <Button className="rounded-full px-10 bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirm} disabled={isSubmitting || !selectedTime}>
                {isSubmitting ? <RefreshCw className="animate-spin mr-2" /> : null}
                {isSubmitting ? "Бронируем..." : "Подтвердить запись"}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
