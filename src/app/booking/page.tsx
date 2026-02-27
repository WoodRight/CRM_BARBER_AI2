
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Scissors, Clock, User, CheckCircle2, ChevronRight, ChevronLeft, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SERVICES = [
  { id: 1, name: "Signature Haircut", price: "$45", duration: "45 min", description: "Precision cut, wash, and style." },
  { id: 2, name: "Beard Sculpt & Trim", price: "$30", duration: "30 min", description: "Edge cleanup and shaping." },
  { id: 3, name: "The Works", price: "$70", duration: "75 min", description: "Full haircut + Beard sculpt + Hot towel." },
  { id: 4, name: "Kid's Cut", price: "$25", duration: "30 min", description: "For our younger style pros (ages 5-12)." },
];

const BARBERS = [
  { id: 1, name: "Alex Rivers", role: "Master Barber", img: "https://picsum.photos/seed/alex/100/100" },
  { id: 2, name: "Sarah Chen", role: "Senior Stylist", img: "https://picsum.photos/seed/sarah/100/100" },
  { id: 3, name: "Marcus Thorne", role: "Grooming Expert", img: "https://picsum.photos/seed/marcus/100/100" },
];

const TIME_SLOTS = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:30 PM", "05:30 PM"];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<typeof BARBERS[0] | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNextStep = () => {
    if (step === 1 && !selectedService) {
       toast({ variant: "destructive", title: "Missing Selection", description: "Please select a service." });
       return;
    }
    if (step === 2 && !selectedBarber) {
       toast({ variant: "destructive", title: "Missing Selection", description: "Please choose a barber." });
       return;
    }
    setStep(prev => prev + 1);
  };

  const handleConfirm = async () => {
    if (!selectedTime) {
      toast({ variant: "destructive", title: "Missing Selection", description: "Please pick a time slot." });
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    setStep(4);
    toast({ title: "Appointment Booked!", description: "We've sent a confirmation to your email." });
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold mb-4">Select Service</h2>
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
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold mb-4">Choose Your Barber</h2>
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
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold mb-4">Select Date & Time</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-card border rounded-xl p-4 shadow-sm">
                 <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                 />
               </div>
               <div className="space-y-4">
                 <h3 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Available Slots</h3>
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
                     {date ? format(date, 'EEEE, MMMM do') : 'Select a date'} at {selectedTime || '...'}
                   </p>
                 </div>
               </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="text-white w-10 h-10" />
             </div>
             <h2 className="text-3xl font-headline font-bold mb-2">Booking Confirmed!</h2>
             <p className="text-muted-foreground mb-8">Your appointment is scheduled. We'll send you a reminder text 2 hours before your cut.</p>
             <Card className="max-w-md mx-auto bg-muted/30 border-none">
                <CardContent className="p-6 text-left space-y-3">
                   <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Service</span> <span className="font-bold">{selectedService?.name}</span></div>
                   <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Barber</span> <span className="font-bold">{selectedBarber?.name}</span></div>
                   <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Date</span> <span className="font-bold">{date && format(date, 'MMM do, yyyy')}</span></div>
                   <div className="flex justify-between"><span className="text-muted-foreground">Time</span> <span className="font-bold">{selectedTime}</span></div>
                </CardContent>
             </Card>
             <div className="mt-8 flex gap-4 justify-center">
                <Link href="/">
                  <Button variant="outline" className="rounded-full">Back to Home</Button>
                </Link>
                <Button className="rounded-full bg-primary" onClick={() => window.print()}>Save Details</Button>
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
        {step < 4 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              {['Service', 'Barber', 'Time'].map((label, idx) => (
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
               <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
            </div>
          </div>
        )}

        <div className="min-h-[500px]">
          {renderStep()}
        </div>

        {step < 4 && (
          <div className="mt-12 flex items-center justify-between pt-8 border-t">
            <Button 
              variant="outline" 
              onClick={() => setStep(prev => prev - 1)} 
              disabled={step === 1}
              className="rounded-full px-6"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            {step < 3 ? (
              <Button 
                onClick={handleNextStep}
                className="rounded-full px-8 bg-primary hover:bg-primary/90"
              >
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="rounded-full px-10 bg-accent hover:bg-accent/90 text-white font-bold"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CalendarIcon className="w-4 h-4 mr-2" />}
                {isSubmitting ? "Processing..." : "Confirm Booking"}
              </Button>
            )
            }
          </div>
        )}
      </main>
    </div>
  );
}

import Link from "next/link";
import { RefreshCw } from "lucide-react";
