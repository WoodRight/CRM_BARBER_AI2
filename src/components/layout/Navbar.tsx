
"use client";

import Link from "next/link";
import { Scissors, LayoutDashboard, Sparkles, Calendar, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  const navLinks = [
    { name: "Услуги", href: "/#services", icon: Scissors },
    { name: "ИИ-стилист", href: "/visualizer", icon: Sparkles },
    { name: "Записаться", href: "/booking", icon: Calendar },
    { name: "Админ", href: "/admin", icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:bg-accent transition-colors duration-300">
                <Scissors className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-headline font-bold text-foreground tracking-tight">BarBerTok</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-accent flex items-center gap-2 transition-colors duration-200"
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
            <Link href="/booking">
              <Button variant="default" className="bg-primary hover:bg-primary/90 rounded-full px-6">
                Начать
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-muted-foreground hover:text-foreground">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className={cn("md:hidden transition-all duration-300", isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-b">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-accent"
            >
              <div className="flex items-center gap-3">
                <link.icon className="w-5 h-5" />
                {link.name}
              </div>
            </Link>
          ))}
          <div className="px-3 py-4">
             <Link href="/booking" onClick={() => setIsOpen(false)}>
              <Button className="w-full rounded-full">Записаться</Button>
             </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
