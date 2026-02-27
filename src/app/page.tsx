
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Scissors, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function Home() {
  const db = useFirestore();
  const siteContentRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "site-content");
  }, [db]);

  const { data: siteContent, isLoading: contentLoading } = useDoc(siteContentRef);

  // Стандартные фото как фолбэк
  const defaultHeroBg = PlaceHolderImages.find(img => img.id === "hero-bg")?.imageUrl;
  const defaultCta1 = PlaceHolderImages.find(img => img.id === "cta-haircut-1")?.imageUrl;
  const defaultCta2 = PlaceHolderImages.find(img => img.id === "cta-haircut-2")?.imageUrl;
  const defaultCta3 = PlaceHolderImages.find(img => img.id === "cta-haircut-3")?.imageUrl;
  const defaultCta4 = PlaceHolderImages.find(img => img.id === "cta-haircut-4")?.imageUrl;

  const heroBg = siteContent?.heroBgUrl || defaultHeroBg;
  const cta1 = siteContent?.ctaImages?.[0] || defaultCta1;
  const cta2 = siteContent?.ctaImages?.[1] || defaultCta2;
  const cta3 = siteContent?.ctaImages?.[2] || defaultCta3;
  const cta4 = siteContent?.ctaImages?.[3] || defaultCta4;

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-[90vh] flex items-center">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 -z-20">
            {heroBg ? (
               <Image
                src={heroBg}
                alt="Background"
                fill
                className="object-cover opacity-20 brightness-[0.3]"
                priority
              />
            ) : <div className="absolute inset-0 bg-muted/20" />}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left z-10">
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
                    <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold w-full sm:w-auto shadow-lg shadow-primary/25">
                      Записаться онлайн
                    </Button>
                  </Link>
                  <Link href="/visualizer">
                    <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg font-bold border-accent text-accent hover:bg-accent hover:text-white transition-all w-full sm:w-auto backdrop-blur-sm">
                      ИИ-стилист
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="services" className="py-24 bg-secondary/50 relative backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4">Почему BarBerTok?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">Мы сочетаем традиционное мастерство с передовыми технологиями для максимального результата.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "ИИ-визуализация",
                  desc: "Хватит гадать. Посмотрите, как новая стрижка или борода будут смотреться на вашем лице до первого взмаха ножниц.",
                  icon: Sparkles,
                  color: "text-accent"
                },
                {
                  title: "Мастера-барберы",
                  desc: "Наша команда состоит из ветеранов индустрии, владеющих как классическими техниками, так и современными трендами.",
                  icon: Scissors,
                  color: "text-primary"
                },
                {
                  title: "Мгновенная запись",
                  desc: "Наличие свободных мест в реальном времени, безопасные платежи и напоминания. Ваше время ценно.",
                  icon: Clock,
                  color: "text-green-500"
                }
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

        {/* AI CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-[4rem] p-8 md:p-20 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]"></div>
              
              <div className="flex-1 z-10 text-center lg:text-left">
                <h2 className="text-4xl md:text-6xl font-headline font-bold text-white mb-8">
                  Готовы к новому образу?
                </h2>
                <p className="text-white/80 text-xl mb-10 leading-relaxed max-w-2xl">
                  Наш продвинутый ИИ-анализатор использует ваше фото, чтобы предложить наиболее подходящие прически на основе формы вашего лица и текстуры волос.
                </p>
                <Link href="/visualizer">
                  <Button size="lg" variant="secondary" className="rounded-full px-12 h-16 text-xl font-bold bg-white text-primary hover:bg-white/90 transition-transform hover:scale-105">
                    Запустить ИИ-стилиста
                  </Button>
                </Link>
              </div>
              
              <div className="flex-1 w-full max-w-md lg:max-w-none relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6 pt-12">
                    {cta1 && (
                      <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
                        <Image src={cta1} fill alt="CTA Image 1" className="object-cover" />
                      </div>
                    )}
                    {cta2 && (
                      <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
                        <Image src={cta2} fill alt="CTA Image 2" className="object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    {cta3 && (
                      <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
                        <Image src={cta3} fill alt="CTA Image 3" className="object-cover" />
                      </div>
                    )}
                    {cta4 && (
                      <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
                        <Image src={cta4} fill alt="CTA Image 4" className="object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-background py-20 border-t border-border/50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Scissors className="text-white w-6 h-6" />
                  </div>
                  <span className="text-2xl font-headline font-bold">BarBerTok</span>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                  Переосмысление современного ухода. Сочетание ремесленного искусства барберинга с искусственным интеллектом, чтобы вы выглядели на все сто.
                </p>
              </div>
              <div>
                <h4 className="font-headline font-bold text-xl mb-8">Навигация</h4>
                <ul className="space-y-5 text-muted-foreground">
                  <li><Link href="/visualizer" className="hover:text-accent transition-colors">ИИ-стилист</Link></li>
                  <li><Link href="/booking" className="hover:text-accent transition-colors">Записаться</Link></li>
                  <li><Link href="/admin" className="hover:text-accent transition-colors">Вход для владельца</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-headline font-bold text-xl mb-8">Контакты</h4>
                <ul className="space-y-5 text-muted-foreground text-base">
                  <li className="flex items-start gap-2">ул. Стрижек, 123, Город Стиля</li>
                  <li className="flex items-start gap-2">Часы: Пн-Сб, 9:00-20:00</li>
                  <li className="flex items-start gap-2 text-primary font-bold">+7 (999) STYLE-PRO</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border/30 pt-10 text-center text-muted-foreground text-sm">
              <p>&copy; {new Date().getFullYear()} BarBerTok Premium Barbershop. Все права защищены.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
