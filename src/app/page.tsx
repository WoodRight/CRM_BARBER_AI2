
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Scissors, Clock, Instagram, Facebook, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";

export default function Home() {
  const db = useFirestore();
  const siteContentRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "site-content");
  }, [db]);

  const { data: siteContent } = useDoc(siteContentRef);

  // Мемоизируем выбор изображений для предотвращения лишних вычислений при рендере
  const images = useMemo(() => {
    const defaultHeroBg = PlaceHolderImages.find(img => img.id === "hero-bg")?.imageUrl;
    const heroSubjectImg = PlaceHolderImages.find(img => img.id === "hero-barber")?.imageUrl;
    const defaultCta1 = PlaceHolderImages.find(img => img.id === "cta-haircut-1")?.imageUrl;
    const defaultCta2 = PlaceHolderImages.find(img => img.id === "cta-haircut-2")?.imageUrl;
    const defaultCta3 = PlaceHolderImages.find(img => img.id === "cta-haircut-3")?.imageUrl;
    const defaultCta4 = PlaceHolderImages.find(img => img.id === "cta-haircut-4")?.imageUrl;

    return {
      heroBg: siteContent?.heroBgUrl || defaultHeroBg,
      heroSubject: heroSubjectImg,
      cta1: siteContent?.ctaImages?.[0] || defaultCta1,
      cta2: siteContent?.ctaImages?.[1] || defaultCta2,
      cta3: siteContent?.ctaImages?.[2] || defaultCta3,
      cta4: siteContent?.ctaImages?.[3] || defaultCta4,
    };
  }, [siteContent]);

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      <main>
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-[95vh] flex items-center">
          <div className="absolute inset-0 -z-20">
            {images.heroBg ? (
               <Image 
                src={images.heroBg} 
                alt="Background" 
                fill 
                className="object-cover opacity-20 brightness-[0.2]" 
                priority // Важно для скорости: загружаем фон сразу
                sizes="100vw"
               />
            ) : <div className="absolute inset-0 bg-muted/20" />}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex flex-col lg:flex-row items-center gap-16 text-center lg:text-left">
              <div className="flex-1 z-10 animate-in fade-in slide-in-from-left duration-700">
                <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 text-primary-foreground text-sm font-semibold mb-6 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Уход за волосами с помощью ИИ
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold mb-6 leading-tight text-white">
                  Ваш уникальный образ, <br />
                  <span className="text-accent">доведенный до совершенства ИИ.</span>
                </h1>
                <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Окунитесь в будущее барбершопов. Примерьте стили виртуально с нашим ИИ-стилистом и запишитесь на стрижку за считанные секунды.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/booking">
                    <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold w-full sm:w-auto shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95">
                      Записаться онлайн
                    </Button>
                  </Link>
                  <Link href="/visualizer">
                    <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg font-bold border-accent text-accent hover:bg-accent hover:text-white transition-all w-full sm:w-auto backdrop-blur-sm active:scale-95">
                      ИИ-стилист
                    </Button>
                  </Link>
                </div>
              </div>

              {images.heroSubject && (
                <div className="flex-1 relative z-10 hidden lg:block animate-in fade-in slide-in-from-right duration-700">
                  <div className="relative aspect-square max-w-md mx-auto rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl transition-transform hover:scale-105 duration-700">
                    <Image 
                      src={images.heroSubject} 
                      alt="Premium Barber Service" 
                      fill 
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      data-ai-hint="professional barber"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="services" className="py-24 bg-secondary/30 relative backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4">Почему BarBerTok?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">Мы сочетаем традиционное мастерство с передовыми технологиями.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "ИИ-визуализация", desc: "Посмотрите, как новая стрижка будет смотреться на вашем лице до первого взмаха ножниц.", icon: Sparkles, color: "text-accent" },
                { title: "Мастера-барберы", desc: "Наша команда состоит из ветеранов индустрии, владеющих всеми техниками.", icon: Scissors, color: "text-primary" },
                { title: "Мгновенная запись", desc: "Наличие свободных мест в реальном времени и удобные напоминания.", icon: Clock, color: "text-green-500" }
              ].map((feature, i) => (
                <Card key={i} className="bg-card/50 border border-border/50 shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                  <CardContent className="pt-10 p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-10 h-10 ${feature.color}`} />
                    </div>
                    <h3 className="text-2xl font-headline font-semibold mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-[4rem] p-8 md:p-20 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative shadow-2xl">
              <div className="flex-1 z-10 text-center lg:text-left text-white">
                <h2 className="text-4xl md:text-6xl font-headline font-bold mb-8">Готовы к новому образу?</h2>
                <p className="text-white/80 text-xl mb-10 leading-relaxed max-w-2xl">Наш продвинутый ИИ-анализатор использует ваше фото, чтобы предложить наиболее подходящие прически.</p>
                <Link href="/visualizer">
                  <Button size="lg" variant="secondary" className="rounded-full px-12 h-16 text-xl font-bold bg-white text-primary hover:bg-white/90 transition-transform hover:scale-105 active:scale-95">
                    Запустить ИИ-стилиста
                  </Button>
                </Link>
              </div>
              <div className="flex-1 w-full max-w-md lg:max-w-none relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6 pt-12">
                    {images.cta1 && <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl hover:scale-105 transition-transform"><Image src={images.cta1} fill alt="CTA 1" className="object-cover" data-ai-hint="modern haircut" /></div>}
                    {images.cta2 && <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl hover:scale-105 transition-transform"><Image src={images.cta2} fill alt="CTA 2" className="object-cover" data-ai-hint="beard grooming" /></div>}
                  </div>
                  <div className="space-y-6">
                    {images.cta3 && <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl hover:scale-105 transition-transform"><Image src={images.cta3} fill alt="CTA 3" className="object-cover" data-ai-hint="classic fade" /></div>}
                    {images.cta4 && <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl hover:scale-105 transition-transform"><Image src={images.cta4} fill alt="CTA 4" className="object-cover" data-ai-hint="barber cutting" /></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-background py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-1">
                <Link href="/" className="flex items-center gap-2 group mb-6">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:bg-accent transition-colors">
                    <Scissors className="text-white w-6 h-6" />
                  </div>
                  <span className="text-xl font-headline font-bold text-foreground tracking-tight">BarBerTok</span>
                </Link>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Премиальный барбершоп, где традиции встречаются с технологиями будущего. Мы создаем ваш идеальный образ с помощью ИИ.
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">Навигация</h4>
                <ul className="space-y-4">
                  <li><Link href="/#services" className="text-muted-foreground hover:text-accent text-sm transition-colors">Услуги</Link></li>
                  <li><Link href="/visualizer" className="text-muted-foreground hover:text-accent text-sm transition-colors">ИИ-стилист</Link></li>
                  <li><Link href="/booking" className="text-muted-foreground hover:text-accent text-sm transition-colors">Запись онлайн</Link></li>
                  <li><Link href="/admin" className="text-muted-foreground hover:text-accent text-sm transition-colors">Панель управления</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">Контакты</h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>ул. Премиальная, 42, Москва</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground text-sm">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span>+7 (999) 000-00-00</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">Соцсети</h4>
                <div className="flex gap-4">
                  <Link href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent hover:text-white transition-all">
                    <Instagram className="w-5 h-5" />
                  </Link>
                  <Link href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent hover:text-white transition-all">
                    <Facebook className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border/50 text-center">
              <p className="text-muted-foreground text-xs">&copy; {new Date().getFullYear()} BarBerTok Premium. Все права защищены.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
