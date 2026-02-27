import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Scissors, Clock, Calendar, ShieldCheck, UserCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const heroImg = PlaceHolderImages.find(img => img.id === "hero-barber");
  const interiorImg = PlaceHolderImages.find(img => img.id === "barbershop-interior");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left z-10">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-primary text-sm font-semibold mb-6 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  Уход за волосами с помощью ИИ
                </div>
                <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6 leading-tight">
                  Ваш уникальный образ, <br />
                  <span className="text-accent">доведенный до совершенства ИИ.</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                  Окунитесь в будущее барбершопов. Примерьте стили виртуально с нашим ИИ-стилистом и запишитесь на стрижку за считанные секунды.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/booking">
                    <Button size="lg" className="rounded-full px-8 text-lg font-medium w-full sm:w-auto">
                      Записаться
                    </Button>
                  </Link>
                  <Link href="/visualizer">
                    <Button size="lg" variant="outline" className="rounded-full px-8 text-lg font-medium border-accent text-accent hover:bg-accent hover:text-white transition-all w-full sm:w-auto">
                      Попробовать ИИ-стилиста
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="relative w-full aspect-square max-w-[500px] mx-auto">
                  <div className="absolute inset-0 bg-accent rounded-[3rem] rotate-6 opacity-20 -z-10"></div>
                  <div className="absolute inset-0 bg-primary rounded-[3rem] -rotate-3 opacity-20 -z-10"></div>
                  <div className="rounded-[2.5rem] overflow-hidden border-4 border-card shadow-2xl relative w-full h-full">
                    <Image
                      src={heroImg?.imageUrl || ""}
                      alt={heroImg?.description || ""}
                      fill
                      className="object-cover"
                      data-ai-hint={heroImg?.imageHint}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="services" className="py-20 bg-secondary/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Почему StylePro AI?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Мы сочетаем традиционное мастерство с передовыми технологиями для максимального результата.</p>
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
                <Card key={i} className="bg-card border-none shadow-xl hover:-translate-y-1 transition-transform duration-300">
                  <CardContent className="pt-8 p-6">
                    <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6`}>
                      <feature.icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-headline font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AI CTA Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-accent/30 rounded-full blur-[100px]"></div>
              
              <div className="flex-1 z-10">
                <h2 className="text-3xl md:text-5xl font-headline font-bold text-white mb-6">
                  Готовы к новому образу?
                </h2>
                <p className="text-white/80 text-lg mb-8 leading-relaxed">
                  Наш продвинутый ИИ-анализатор использует ваше фото, чтобы предложить наиболее подходящие прически на основе формы вашего лица и текстуры волос.
                </p>
                <Link href="/visualizer">
                  <Button size="lg" variant="secondary" className="rounded-full px-10 text-lg font-semibold bg-white text-primary hover:bg-white/90">
                    Запустить ИИ-стилиста
                  </Button>
                </Link>
              </div>
              
              <div className="flex-1 w-full max-w-sm lg:max-w-none relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 pt-8">
                    <div className="rounded-2xl overflow-hidden aspect-square relative border-2 border-white/20">
                      <Image src="https://picsum.photos/seed/face1/300/300" fill alt="Face Shape 1" className="object-cover" />
                    </div>
                    <div className="rounded-2xl overflow-hidden aspect-square relative border-2 border-white/20">
                      <Image src="https://picsum.photos/seed/face2/300/300" fill alt="Face Shape 2" className="object-cover" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl overflow-hidden aspect-square relative border-2 border-white/20">
                      <Image src="https://picsum.photos/seed/face3/300/300" fill alt="Face Shape 3" className="object-cover" />
                    </div>
                    <div className="rounded-2xl overflow-hidden aspect-square relative border-2 border-white/20">
                      <Image src="https://picsum.photos/seed/face4/300/300" fill alt="Face Shape 4" className="object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-secondary/30 py-12 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Scissors className="text-white w-5 h-5" />
                  </div>
                  <span className="text-xl font-headline font-bold">StylePro AI</span>
                </div>
                <p className="text-muted-foreground max-w-sm leading-relaxed mb-6">
                  Переосмысление современного ухода. Сочетание ремесленного искусства барберинга с искусственным интеллектом, чтобы вы выглядели на все сто.
                </p>
              </div>
              <div>
                <h4 className="font-headline font-bold mb-6">Ссылки</h4>
                <ul className="space-y-4 text-muted-foreground">
                  <li><Link href="/visualizer" className="hover:text-accent transition-colors">ИИ-стилист</Link></li>
                  <li><Link href="/booking" className="hover:text-accent transition-colors">Записаться</Link></li>
                  <li><Link href="/admin" className="hover:text-accent transition-colors">Вход для владельца</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-headline font-bold mb-6">Контакты</h4>
                <ul className="space-y-4 text-muted-foreground text-sm">
                  <li>ул. Стрижек, 123, Город Стиля</li>
                  <li>Часы: Пн-Сб, 9:00-20:00</li>
                  <li>+7 (999) STYLE-PRO</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-8 text-center text-muted-foreground text-xs">
              <p>&copy; {new Date().getFullYear()} StylePro AI Barbershop. Все права защищены.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
