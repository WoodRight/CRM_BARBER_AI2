
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Scissors, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const heroBg = PlaceHolderImages.find(img => img.id === "hero-bg");
  const heroImg = PlaceHolderImages.find(img => img.id === "hero-barber");
  const cta1 = PlaceHolderImages.find(img => img.id === "cta-haircut-1");
  const cta2 = PlaceHolderImages.find(img => img.id === "cta-haircut-2");
  const cta3 = PlaceHolderImages.find(img => img.id === "cta-haircut-3");
  const cta4 = PlaceHolderImages.find(img => img.id === "cta-haircut-4");

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-[90vh] flex items-center">
          {/* Background Image with Overlay */}
          {heroBg && (
            <div className="absolute inset-0 -z-20">
              <Image
                src={heroBg.imageUrl}
                alt="Background"
                fill
                className="object-cover opacity-20 brightness-[0.3]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
            </div>
          )}

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
              <div className="flex-1 relative hidden lg:block">
                <div className="relative w-full aspect-square max-w-[550px] mx-auto">
                  <div className="absolute inset-0 bg-accent rounded-[3rem] rotate-6 opacity-10 -z-10 animate-pulse"></div>
                  <div className="absolute inset-0 bg-primary rounded-[3rem] -rotate-3 opacity-10 -z-10"></div>
                  <div className="rounded-[2.5rem] overflow-hidden border-4 border-card/20 shadow-2xl relative w-full h-full backdrop-blur-sm">
                    {heroImg?.imageUrl ? (
                      <Image
                        src={heroImg.imageUrl}
                        alt={heroImg.description}
                        fill
                        className="object-cover"
                        data-ai-hint={heroImg.imageHint}
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Scissors className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
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
                        <Image src={cta1.imageUrl} fill alt={cta1.description} className="object-cover" data-ai-hint={cta1.imageHint} />
                      </div>
                    )}
                    {cta2 && (
                      <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
                        <Image src={cta2.imageUrl} fill alt={cta2.description} className="object-cover" data-ai-hint={cta2.imageHint} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    {cta3 && (
                      <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
                        <Image src={cta3.imageUrl} fill alt={cta3.description} className="object-cover" data-ai-hint={cta3.imageHint} />
                      </div>
                    )}
                    {cta4 && (
                      <div className="rounded-3xl overflow-hidden aspect-square relative border-4 border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
                        <Image src={cta4.imageUrl} fill alt={cta4.description} className="object-cover" data-ai-hint={cta4.imageHint} />
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
