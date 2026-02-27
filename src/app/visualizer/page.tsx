
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Sparkles, RefreshCw, Download, Scissors, User, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { aiHairstyleTryOn } from "@/ai/flows/ai-hairstyle-try-on";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const HAIRSTYLES = [
  "Бокс",
  "Классический Помпадур",
  "Текстурированный Квифф",
  "Пробор на бок",
  "Длинные кудри",
  "Пучок (Man Bun)",
  "Тейпер Фейд",
  "Ирокез",
  "Викингские косы",
  "Средняя длина (Сёрфер)"
];

export default function VisualizerPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const sampleImage = PlaceHolderImages.find(img => img.id === "sample-man-portrait");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const useSamplePhoto = () => {
    if (sampleImage) {
      setPhoto(sampleImage.imageUrl);
      setGeneratedImage(null);
      toast({ title: "Загружен пример", description: "Используется демонстрационное фото для теста." });
    }
  };

  const handleGenerate = async () => {
    const styleDescription = customStyle || selectedStyle;
    
    if (!photo) {
      toast({ variant: "destructive", title: "Загрузите фото", description: "Пожалуйста, сначала загрузите свое фото или используйте пример." });
      return;
    }
    if (!styleDescription) {
      toast({ variant: "destructive", title: "Выберите стиль", description: "Пожалуйста, выберите прическу или опишите ее." });
      return;
    }

    setLoading(true);
    setProgress(10);
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 1500);

    try {
      // If it's the placeholder URL, we need to handle it or use a data URI if possible. 
      // For the demo to work robustly with our server action, we'll fetch the image and convert to base64 if it's external.
      let photoToProcess = photo;
      if (photo.startsWith('http')) {
        const response = await fetch(photo);
        const blob = await response.blob();
        photoToProcess = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const result = await aiHairstyleTryOn({
        photoDataUri: photoToProcess,
        hairstyleDescription: styleDescription,
      });
      setGeneratedImage(result.generatedHairstyleImage);
      setProgress(100);
      toast({ title: "Стиль создан!", description: "ИИ завершил обработку вашего нового образа." });
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка", description: "Что-то пошло не так при применении стиля." });
    } finally {
      setLoading(false);
      clearInterval(timer);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-headline font-bold mb-4">ИИ-визуализатор <span className="text-accent">причесок</span></h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Увидьте свое преображение до того, как запишетесь. Загрузите четкое фото лица или используйте наш пример.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Шаг 1: Загрузка фото
                </CardTitle>
                <CardDescription>Загрузите свой портрет или используйте демо-фото.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 text-center cursor-pointer ${photo ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-accent'}`}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="photo-upload" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  {photo ? (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-border shadow-sm mx-auto">
                       <Image src={photo} alt="Preview" fill className="object-cover" />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm font-medium">Изменить фото</p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Upload className="text-muted-foreground w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">Нажмите для загрузки</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG до 5МБ</p>
                    </div>
                  )}
                </div>
                {!photo && (
                  <Button variant="outline" className="w-full text-xs h-9 border-dashed" onClick={(e) => { e.stopPropagation(); useSamplePhoto(); }}>
                    <ImageIcon className="w-3.5 h-3.5 mr-2" /> Использовать пример мужчины
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-accent" /> Шаг 2: Выбор стиля
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Готовые стили</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {HAIRSTYLES.map((style) => (
                      <Button
                        key={style}
                        variant={selectedStyle === style ? "default" : "outline"}
                        size="sm"
                        className={`text-xs h-9 justify-start px-3 rounded-lg overflow-hidden truncate ${selectedStyle === style ? 'bg-primary' : 'hover:border-accent'}`}
                        onClick={() => {
                          setSelectedStyle(style);
                          setCustomStyle("");
                        }}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-style">Свое описание</Label>
                  <Input 
                    id="custom-style"
                    placeholder="Например: 'Кудри сверху и фейд по бокам'" 
                    className="bg-muted/50 border-border focus:ring-accent"
                    value={customStyle}
                    onChange={(e) => {
                      setCustomStyle(e.target.value);
                      setSelectedStyle("");
                    }}
                  />
                </div>

                <Button 
                  className="w-full h-12 text-lg rounded-xl font-bold bg-primary hover:bg-primary/90"
                  disabled={loading || !photo}
                  onClick={handleGenerate}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" /> Рендеринг...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> Применить стиль
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <Card className="bg-card border-border shadow-xl h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Результат превью</span>
                    {generatedImage && (
                      <Button variant="ghost" size="sm" className="text-accent" onClick={() => window.open(generatedImage)}>
                        <Download className="w-4 h-4 mr-2" /> Скачать
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-0 md:p-6 bg-secondary/20 min-h-[400px]">
                  {loading ? (
                    <div className="w-full max-w-md space-y-8 px-6 text-center">
                       <div className="relative w-32 h-32 mx-auto">
                          <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                          <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-accent animate-pulse" />
                       </div>
                       <div className="space-y-3">
                         <h3 className="text-xl font-semibold">ИИ анализирует ваши черты лица...</h3>
                         <Progress value={progress} className="h-2 bg-muted" />
                         <p className="text-sm text-muted-foreground">Обычно это занимает 10-15 секунд для качественного результата.</p>
                       </div>
                    </div>
                  ) : generatedImage ? (
                    <div className="relative w-full aspect-[4/5] max-w-lg rounded-2xl overflow-hidden shadow-2xl group">
                       <Image src={generatedImage} alt="AI Result" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-white font-medium text-sm">
                          Новый образ: {customStyle || selectedStyle}
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-12 text-muted-foreground opacity-50">
                       <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                         <Sparkles className="w-12 h-12" />
                       </div>
                       <p className="text-lg font-medium">Ваш новый образ появится здесь</p>
                       <p className="text-sm">Выполните шаги слева, чтобы начать</p>
                    </div>
                  )}
                </CardContent>
                {generatedImage && (
                  <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-card">
                     <p className="text-sm font-medium">Нравится этот стиль? Запишитесь к нашим мастерам, чтобы воплотить его в реальность.</p>
                     <Link href="/booking">
                       <Button variant="default" className="bg-accent hover:bg-accent/90 rounded-full px-8">
                         Записаться на эту стрижку
                       </Button>
                     </Link>
                  </div>
                )}
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
