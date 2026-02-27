"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Scissors, 
  Clock, 
  User, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  CalendarIcon,
  Sparkles,
  Upload,
  RefreshCw,
  Camera,
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

const SERVICES = [
  { id: 1, name: "Фирменная стрижка", price: "2500 ₽", duration: "45 мин", description: "Точная стрижка, мытье головы и укладка." },
  { id: 2, name: "Скульптура и коррекция бороды", price: "1500 ₽", duration: "30 мин", description: "Очистка краев и придание формы." },
  { id: 3, name: "Полный комплекс", price: "3500 ₽", duration: "75 мин", description: "Стрижка + Борода + Горячее полотенце." },
  { id: 4, name: "Детская стрижка", price: "1200 ₽", duration: "30 мин", description: "Для наших юных профи (5-12 лет)." },
];

const BARBERS = [
  { id: 1, name: "Алекс Риверс", role: "Топ-барбер", img: "https://picsum.photos/seed/alex/100/100" },
  { id: 2, name: "Сара Чен", role: "Старший стилист", img: "https://picsum.photos/seed/sarah/100/100" },
  { id: 3, name: "Маркус Торн", role: "Эксперт по уходу", img: "https://picsum.photos/seed/marcus/100/100" },
];

const PRESET_STYLES = [
  "Бокс", "Классический Помпадур", "Фейд", "Текстурированный Квифф", "Пробор на бок"
];

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:30", "17:30"];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<typeof BARBERS[0] | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // AI Visualizer State
  const [photo, setPhoto] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStyle, setAiStyle] = useState("");

  const { toast } = useToast();
  const sampleImage = PlaceHolderImages.find(img => img.id === "sample-man-portrait");

  const handleNextStep = () => {
    if (step === 1 && !selectedService) {
       toast({ variant: "destructive", title: "Ничего не выбрано", description: "Пожалуйста, выберите услугу." });
       return;
    }
    if (step === 3 && !selectedBarber) {
       toast({ variant: "destructive", title: "Ничего не выбрано", description: "Пожалуйста, выберите мастера." });
       return;
    }
    setStep(prev => prev + 1);
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

  const useSamplePhoto = () => {
    if (sampleImage) {
      setPhoto(sampleImage.imageUrl);
      setAiGeneratedImage(null);
      toast({ title: "Загружен пример", description: "Используется демо-фото для ИИ-примерки." });
    }
  };

  const handleAiVisualize = async () => {
    if (!photo) {
      toast({ variant: "destructive", title: "Загрузите фото", description: "Пожалуйста, загрузите фото или используйте пример." });
      return;
    }
    if (!aiStyle) {
      toast({ variant: "destructive", title: "Выберите стиль", description: "Пожалуйста, выберите или опишите стиль." });
      return;
    }

    setAiLoading(true);
    setAiProgress(10);
    const interval = setInterval(() => setAiProgress(p => p < 90 ? p + 5 : p), 1000);

    try {
      const result = await aiHairstyleTryOn({
        photoDataUri: photo,
        hairstyleDescription: aiStyle,
      });
      setAiGeneratedImage(result.generatedHairstyleImage);
      setAiProgress(100);
      toast({ title: "Визуализация готова", description: "ИИ создал ваш новый образ!" });
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Ошибка ИИ", 
        description: err.message || "Не удалось создать образ. Попробуйте еще раз." 
      });
    } finally {
      setAiLoading(false);
      clearInterval(interval);
    }
  };

  const handleConfirm = async () => {
    if (!selectedTime) {
      toast({ variant: "destructive", title: "Ничего не выбрано", description: "Пожалуйста, выберите время." });
      return;
    }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    setStep(5);
    toast({ title: "Запись подтверждена!", description: "Мы отправили подтверждение на вашу почту." });
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold mb-4">Выберите услугу</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SERVICES.map((service) => (
                <Card 
                  key={service.id} 
                  className={cn("cursor-pointer transition-all border-2", selectedService?.id === service.id ? "border-primary bg-primary/5" : "border-border hover:border-accent")}
                  onClick={() => setSelectedService(service)}
                >
                  <CardContent className="p-6 flex justify-between items-start">
                    <div>
                       <h3 className="font-bold text-lg">{service.name}</h3>
                       <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                       <div className="flex gap-4 text-xs font-medium text-muted-foreground">
                         <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration}</span>
                         <span className="flex items-center gap-1 text-primary"><Scissors className="w-3 h-3" /> {service.price}</span>
                       </div>
                    </div>
                    {selectedService?.id === service.id && <CheckCircle2 className="text-primary w-6 h-6" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-headline font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-accent" /> ИИ-стилист (Опционально)
                </h2>
                <p className="text-muted-foreground">Посмотрите, как вы будете выглядеть, прежде чем мы начнем стричь.</p>
              </div>
              <Button variant="ghost" className="text-muted-foreground" onClick={() => setStep(3)}>Пропустить <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <Label>1. Загрузите фото</Label>
                    <div 
                      className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors h-48 flex flex-col items-center justify-center relative overflow-hidden"
                      onClick={() => document.getElementById('photo-input')?.click()}
                    >
                      <input id="photo-input" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      {photo ? (
                        <div className="relative w-full h-full">
                          <Image src={photo} alt="Source" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm">Нажмите, чтобы загрузить портрет</p>
                        </div>
                      )}
                      {photo && <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity text-white font-bold">Изменить фото</div>}
                    </div>
                    {!photo && (
                      <Button variant="outline" className="w-full text-xs h-8 border-dashed" onClick={(e) => { e.stopPropagation(); useSamplePhoto(); }}>
                        <ImageIcon className="w-3.5 h-3.5 mr-2" /> Использовать демо-фото мужчины
                      </Button>
                    )}

                    <Label>2. Выберите или опишите стиль</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_STYLES.map(s => (
                        <Button key={s} variant={aiStyle === s ? "default" : "outline"} size="sm" onClick={() => setAiStyle(s)} className="text-xs">
                          {s}
                        </Button>
                      ))}
                    </div>
                    <Input placeholder="Или опишите сами..." value={aiStyle} onChange={(e) => setAiStyle(e.target.value)} />
                    
                    <Button 
                      className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12" 
                      onClick={handleAiVisualize}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                      Создать превью
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-center bg-muted/30 rounded-2xl min-h-[300px] border relative overflow-hidden">
                {aiLoading ? (
                  <div className="text-center p-8 w-full">
                    <Progress value={aiProgress} className="mb-4" />
                    <p className="text-sm font-medium animate-pulse">ИИ создает ваш образ...</p>
                  </div>
                ) : aiGeneratedImage ? (
                  <Image src={aiGeneratedImage} alt="AI Result" fill className="object-cover" />
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <Camera className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Здесь появится ваш ИИ-образ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold mb-4">Выберите мастера</h2>
            <div className="grid grid-cols-1 gap-4">
              {BARBERS.map((barber) => (
                <Card 
                  key={barber.id} 
                  className={cn("cursor-pointer transition-all border-2", selectedBarber?.id === barber.id ? "border-primary bg-primary/5" : "border-border hover:border-accent")}
                  onClick={() => setSelectedBarber(barber)}
                >
                  <CardContent className="p-4 flex items-center gap-6">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                      <Image src={barber.img} alt={barber.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                       <h3 className="font-bold text-lg">{barber.name}</h3>
                       <p className="text-sm text-muted-foreground">{barber.role}</p>
                    </div>
                    {selectedBarber?.id === barber.id && <CheckCircle2 className="text-primary w-6 h-6" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold mb-4">Выберите дату и время</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-card border rounded-xl p-4 shadow-sm">
                 <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                    locale={ru}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                 />
               </div>
               <div className="space-y-4">
                 <h3 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Свободные окна</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIME_SLOTS.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className={cn("rounded-lg", selectedTime === time && "bg-primary")}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                 </div>
                 <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mt-6">
                   <p className="text-sm text-accent font-medium flex items-center gap-2">
                     <CalendarIcon className="w-4 h-4" /> 
                     {date ? format(date, 'EEEE, d MMMM', { locale: ru }) : 'Выберите дату'} в {selectedTime || '...'}
                   </p>
                 </div>
               </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="text-white w-10 h-10" />
             </div>
             <h2 className="text-3xl font-headline font-bold mb-2">Запись подтверждена!</h2>
             <p className="text-muted-foreground mb-8">Ваш визит запланирован. Мы отправили подтверждение на вашу почту.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
               <Card className="bg-muted/30 border-none">
                  <CardContent className="p-6 text-left space-y-3">
                     <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Услуга</span> <span className="font-bold">{selectedService?.name}</span></div>
                     <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Мастер</span> <span className="font-bold">{selectedBarber?.name}</span></div>
                     <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Дата</span> <span className="font-bold">{date && format(date, 'd MMMM yyyy', { locale: ru })}</span></div>
                     <div className="flex justify-between"><span className="text-muted-foreground">Время</span> <span className="font-bold">{selectedTime}</span></div>
                  </CardContent>
               </Card>
               {aiGeneratedImage && (
                 <Card className="overflow-hidden border-accent/20 bg-accent/5">
                   <CardContent className="p-0 relative aspect-square">
                     <Image src={aiGeneratedImage} alt="Chosen Style" fill className="object-cover" />
                     <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-[10px] font-bold text-center uppercase">
                       ИИ-визуализация
                     </div>
                   </CardContent>
                 </Card>
               )}
             </div>
             <div className="mt-8 flex gap-4 justify-center">
                <Link href="/">
                  <Button variant="outline" className="rounded-full">На главную</Button>
                </Link>
                <Button className="rounded-full bg-primary" onClick={() => window.print()}>Сохранить детали</Button>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {step < 5 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              {['Услуга', 'ИИ-стиль', 'Мастер', 'Время'].map((label, idx) => (
                <div key={label} className="flex flex-col items-center flex-1">
                   <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors", 
                    step > idx + 1 ? "bg-green-500 text-white" : step === idx + 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                      {step > idx + 1 ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                   </div>
                   <span className={cn("text-xs font-medium", step >= idx + 1 ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                </div>
              ))}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
               <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>
          </div>
        )}

        <div className="min-h-[500px]">
          {renderStep()}
        </div>

        {step < 5 && (
          <div className="mt-12 flex items-center justify-between pt-8 border-t">
            <Button 
              variant="outline" 
              onClick={() => setStep(prev => prev - 1)} 
              disabled={step === 1}
              className="rounded-full px-6"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Назад
            </Button>
            
            {step < 4 ? (
              <Button 
                onClick={handleNextStep}
                className="rounded-full px-8 bg-primary hover:bg-primary/90"
              >
                {step === 2 ? "Продолжить с этим образом" : "Следующий шаг"} <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="rounded-full px-10 bg-accent hover:bg-accent/90 text-white font-bold"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CalendarIcon className="w-4 h-4 mr-2" />}
                {isSubmitting ? "Обработка..." : "Подтвердить запись"}
              </Button>
            )
            }
          </div>
        )}
      </main>
    </div>
  );
}
