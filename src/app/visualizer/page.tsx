
"use client";

import { useState } from "react";
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
  const [selectedStyle, setSelectedStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
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
      toast({ title: "Загружен пример", description: "Используется оптимизированный демо-портрет." });
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
            Использует специализированный алгоритм AILabTools для реалистичной примерки волос.
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
            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Шаг 1: Фото
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 text-center cursor-pointer ${photo ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-accent'}`}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                  {photo ? (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-border shadow-sm mx-auto">
                       <Image src={photo} alt="Превью" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Upload className="text-muted-foreground w-8 h-8 mb-2" />
                      <p className="text-sm font-medium">Загрузить портрет</p>
                      <p className="text-xs text-muted-foreground">До 5 МБ</p>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full text-xs h-9 border-dashed" onClick={useSamplePhoto}>
                  <ImageIcon className="w-3.5 h-3.5 mr-2" /> Использовать пример фото
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-accent" /> Шаг 2: Стиль
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-48 pr-4">
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
                <Input 
                  placeholder="Или впишите стиль..." 
                  value={customStyle}
                  onChange={(e) => { setCustomStyle(e.target.value); setSelectedStyle(""); }}
                />
                <Button 
                  className="w-full h-12 text-lg rounded-xl font-bold bg-primary hover:bg-primary/90"
                  disabled={loading || !photo}
                  onClick={handleGenerate}
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  {loading ? "Генерация..." : "Создать образ"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
             <Card className="bg-card border-border shadow-xl h-full min-h-[500px] flex flex-col">
                <CardContent className="flex-1 flex flex-col items-center justify-center bg-secondary/10 p-4 rounded-xl relative">
                  {loading ? (
                    <div className="w-full max-w-md text-center space-y-4 z-10">
                       <Progress value={progress} className="h-2" />
                       <p className="text-sm font-medium animate-pulse">ИИ трансформирует ваш образ...</p>
                    </div>
                  ) : generatedImage ? (
                    <div className="relative w-full h-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                       <Image src={generatedImage} alt="Результат ИИ" fill className="object-cover" />
                       <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-white text-xs text-center">
                         Образ: {customStyle || selectedStyle}
                       </div>
                    </div>
                  ) : (
                    <div className="text-center opacity-30">
                       <Sparkles className="w-16 h-16 mx-auto mb-4" />
                       <p>Загрузите фото и выберите стиль</p>
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
