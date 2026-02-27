
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Sparkles, RefreshCw, Download, Scissors, User } from "lucide-react";
import Image from "next/image";
import { aiHairstyleTryOn } from "@/ai/flows/ai-hairstyle-try-on";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const HAIRSTYLES = [
  "Buzz Cut",
  "Classic Pompadour",
  "Short Textured Quiff",
  "Sleek Side Part",
  "Long Curly Hair",
  "Top Knot Man Bun",
  "Taper Fade",
  "Mohawk",
  "Viking Braids",
  "Mid-Length Surfer Hair"
];

export default function VisualizerPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

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

  const handleGenerate = async () => {
    const styleDescription = customStyle || selectedStyle;
    
    if (!photo) {
      toast({ variant: "destructive", title: "Missing Photo", description: "Please upload a photo of yourself first." });
      return;
    }
    if (!styleDescription) {
      toast({ variant: "destructive", title: "Select a Style", description: "Please pick a hairstyle or describe one." });
      return;
    }

    setLoading(true);
    setProgress(10);
    
    // Fake progress animation
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 1500);

    try {
      const result = await aiHairstyleTryOn({
        photoDataUri: photo,
        hairstyleDescription: styleDescription,
      });
      setGeneratedImage(result.generatedHairstyleImage);
      setProgress(100);
      toast({ title: "Style Generated!", description: "The AI has finished rendering your new look." });
    } catch (error) {
      toast({ variant: "destructive", title: "Generation Failed", description: "Something went wrong while applying the style." });
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
          <h1 className="text-4xl font-headline font-bold mb-4">AI Hairstyle <span className="text-accent">Visualizer</span></h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See your new transformation before you book. Upload a clear photo of your face and pick a style to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Step 1: Upload Photo
                </CardTitle>
                <CardDescription>A clear, front-facing portrait works best.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 text-center cursor-pointer ${photo ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-accent'}`}
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
                          <p className="text-white text-sm font-medium">Change Photo</p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Upload className="text-muted-foreground w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">Click to upload photo</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 5MB</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-accent" /> Step 2: Choose Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Preset Styles</Label>
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
                  <Label htmlFor="custom-style">Custom Description</Label>
                  <Input 
                    id="custom-style"
                    placeholder="e.g. 'Curly top with skin fade'" 
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
                      <RefreshCw className="w-5 h-5 animate-spin" /> Rendering...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> Apply Style
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-6">
             <Card className="bg-card border-border shadow-xl h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Preview Result</span>
                    {generatedImage && (
                      <Button variant="ghost" size="sm" className="text-accent" onClick={() => window.open(generatedImage)}>
                        <Download className="w-4 h-4 mr-2" /> Download
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
                         <h3 className="text-xl font-semibold">AI is analyzing your features...</h3>
                         <Progress value={progress} className="h-2 bg-muted" />
                         <p className="text-sm text-muted-foreground">Usually takes 10-15 seconds for a high-quality render.</p>
                       </div>
                    </div>
                  ) : generatedImage ? (
                    <div className="relative w-full aspect-[4/5] max-w-lg rounded-2xl overflow-hidden shadow-2xl group">
                       <Image src={generatedImage} alt="AI Result" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-white font-medium text-sm">
                          New Look: {customStyle || selectedStyle}
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-12 text-muted-foreground opacity-50">
                       <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                         <Sparkles className="w-12 h-12" />
                       </div>
                       <p className="text-lg font-medium">Your new look will appear here</p>
                       <p className="text-sm">Complete the steps on the left to begin</p>
                    </div>
                  )}
                </CardContent>
                {generatedImage && (
                  <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-card">
                     <p className="text-sm font-medium">Love this style? Book an appointment with our master barbers to make it a reality.</p>
                     <Link href="/booking">
                       <Button variant="default" className="bg-accent hover:bg-accent/90 rounded-full px-8">
                         Book This Cut
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

import Link from "next/link";
