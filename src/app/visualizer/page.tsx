
"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles, RefreshCw, Scissors, User, Image as ImageIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import { aiHairstyleTryOn } from "@/ai/flows/ai-hairstyle-try-on";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const HAIRSTYLES = [
  "Бокс",
  "Фейд",
  "Классический Помпадур",
  "Текстурированный Квифф",
  "Пробор на бок",
  "Мужской пучок",
  "Андеркат",
  "Афро",
  "Длинные кудри",
  "Дреды",
  "Тейпер",
  "Квифф"
];

export default function VisualizerPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("Андеркат");
  const [customStyle, setCustomStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sampleImage = PlaceHolderImages.find(img => img.id === "sample-man-portrait");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Файл слишком большой", description: "Пожалуйста, используйте фото до 5 МБ." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setGeneratedImage(null);
        setErrorDetails(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const useSamplePhoto = () => {
    if (sampleImage) {
      setPhoto(sampleImage.imageUrl);
      setGeneratedImage(null);
      setErrorDetails(null);
      toast({ title: "Загружен пример", description: "Используется качественный демо-портрет." });
    }
  };

  const handleGenerate = async () => {
    const styleDescription = customStyle || selectedStyle;
    
    if (!photo) {
      toast({ variant: "destructive", title: "Загрузите фото", description: "Пожалуйста, загрузите свое фото или используйте пример." });
      return;
    }
    if (!styleDescription) {
      toast({ variant: "destructive", title: "Выберите стиль", description: "Пожалуйста, выберите прическу." });
      return;
    }

    setLoading(true);
    setProgress(10);
    setErrorDetails(null);
    
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 5));
    }, 1000);

    try {
      const result = await aiHairstyleTryOn({
        photoDataUri: photo,
        hairstyleDescription: styleDescription,
      });
      setGeneratedImage(result.generatedHairstyleImage);
      setProgress(100);
      toast({ title: "Стиль создан!", description: "ИИ успешно обработал ваш образ." });
    } catch (error: any) {
      const msg = error.message || "Ошибка генерации";
      setErrorDetails(msg);
      toast({ variant: "destructive", title: "Ошибка ИИ", description: msg });
    } finally {
      setLoading(false);
      clearInterval(timer);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-headline font-bold mb-4">ИИ-визуализатор <span className="text-accent">причесок</span></h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Загрузите свое фото в анфас или используйте наш пример для теста.
          </p>
        </div>

        {errorDetails && (
          <Alert variant="destructive" className="mb-8 max-w-4xl mx-auto bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Проблема с генерацией</AlertTitle>
            <AlertDescription>
              {errorDetails}
              <div className="mt-2 text-xs opacity-80">
                Совет: Убедитесь, что на фото четко видно лицо в анфас.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border shadow-xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-primary" /> 1. Ваше фото
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-xl p-4 transition-all duration-300 text-center cursor-pointer relative aspect-square flex items-center justify-center overflow-hidden",
                    photo ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:border-accent hover:bg-accent/5'
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  {photo ? (
                    <Image src={photo} alt="Превью" fill className="object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-muted rounded-full">
                        <Upload className="text-muted-foreground w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">Загрузить портрет</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">JPG, PNG до 5 МБ</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-9" onClick={useSamplePhoto}>
                    <ImageIcon className="w-3.5 h-3.5 mr-2" /> Попробовать на примере
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setPhoto(null)}>
                    Сбросить фото
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xl">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scissors className="w-5 h-5 text-accent" /> 2. Выбор стиля
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <ScrollArea className="h-48 pr-4 border rounded-md p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {HAIRSTYLES.map((style) => (
                      <Button
                        key={style}
                        variant={selectedStyle === style ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-9 justify-start"
                        onClick={() => { setSelectedStyle(style); setCustomStyle(""); }}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold px-1">Свой вариант</p>
                  <Input 
                    placeholder="Например: Длинные кудри..." 
                    value={customStyle}
                    onChange={(e) => { setCustomStyle(e.target.value); setSelectedStyle(""); }}
                  />
                </div>
                <Button 
                  className="w-full h-12 text-lg rounded-xl font-bold bg-primary hover:bg-primary/90 mt-2 shadow-lg shadow-primary/20"
                  disabled={loading || !photo}
                  onClick={handleGenerate}
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  {loading ? "Генерация..." : "Примерить"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
             <Card className="bg-card border-border shadow-xl h-full min-h-[500px] flex flex-col overflow-hidden">
                <CardContent className="flex-1 flex flex-col items-center justify-center bg-secondary/10 p-4 rounded-xl relative">
                  {loading ? (
                    <div className="w-full max-w-md text-center space-y-6 z-10 p-8 bg-background/80 backdrop-blur-md rounded-3xl border shadow-2xl">
                       <div className="relative w-20 h-20 mx-auto">
                         <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                         <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                       </div>
                       <div className="space-y-2">
                         <h3 className="text-xl font-headline font-bold">ИИ в работе...</h3>
                         <Progress value={progress} className="h-2" />
                         <p className="text-sm text-muted-foreground">Трансформируем ваш образ под стиль {customStyle || selectedStyle}</p>
                       </div>
                    </div>
                  ) : generatedImage ? (
                    <div className="relative w-full h-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl group">
                       <Image src={generatedImage} alt="Результат ИИ" fill className="object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                         <p className="text-white font-bold text-xl mb-1">Ваш новый {customStyle || selectedStyle}</p>
                         <p className="text-white/70 text-sm">Нравится результат? Запишитесь к нам!</p>
                       </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                       <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                         <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                       </div>
                       <h3 className="text-xl font-headline font-bold opacity-50">Здесь появится результат</h3>
                       <p className="text-muted-foreground opacity-50 max-w-xs mx-auto">Выберите фото и стиль слева, чтобы начать магию ИИ</p>
                    </div>
                  )}
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
