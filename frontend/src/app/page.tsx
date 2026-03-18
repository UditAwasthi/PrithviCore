'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Droplets, Sprout, ShieldCheck, BarChart3, Users, Factory, ArrowRight, Activity, Leaf, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// ----------------------------------------------------------------------
// Landing Navbar
// ----------------------------------------------------------------------
function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Leaf size={24} />
          </div>
          <span className="text-xl font-black tracking-tight text-foreground hidden sm:block">PrithviCore</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
          <a href="#use-cases" className="hover:text-primary transition-colors">Use Cases</a>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" className="font-bold hidden sm:inline-flex">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button className="font-bold shadow-md shadow-primary/20 rounded-full px-6 bg-gradient-to-r from-primary to-green-500 hover:from-primary/90 hover:to-green-500/90 border-0">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ----------------------------------------------------------------------
// Hero Section
// ----------------------------------------------------------------------
function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center text-center px-6">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-1/2 right-0 translate-x-1/3 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto z-10">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[1.1] mb-6">
          The Intelligent OS for <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-green-500 to-teal-400">
            Modern Agriculture
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          Transform your farm from a basic operation into a premium, scalable eco-tech ecosystem. Harness real-time soil analytics, AI disease scanning, and actionable insights.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-teal-500 hover:scale-105 transition-all w-full sm:w-auto px-8 py-6 text-base font-bold border-0">
              Start Free Trial <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto px-8 py-6 text-base font-bold bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted/50">
              Explore Platform
            </Button>
          </a>
        </div>
      </motion.div>

      {/* Floating Mockup Graphics */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-20 relative w-full max-w-5xl mx-auto"
      >
         <div className="relative rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-2xl p-2 md:p-4 shadow-2xl overflow-hidden">
           <Image src="/hero-mockup.png" alt="PrithviCore Dashboard Mockup" width={1600} height={900} className="rounded-xl border border-border/50 shadow-inner w-full h-auto object-cover" priority />
         </div>
         
         {/* Floating Elements */}
         <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} 
           className="absolute -right-8 top-1/4 bg-background border border-border shadow-xl rounded-2xl p-4 flex items-center gap-4 hidden lg:flex">
             <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"><CheckCircle2 /></div>
             <div>
               <p className="text-sm font-bold text-foreground">Optimal Soil pH</p>
               <p className="text-xs text-muted-foreground">Adjustments successful</p>
             </div>
         </motion.div>
         <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} 
           className="absolute -left-12 bottom-1/4 bg-background border border-border shadow-xl rounded-2xl p-4 flex items-center gap-4 hidden lg:flex">
             <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500"><Activity /></div>
             <div>
               <p className="text-sm font-bold text-foreground">Disease Scan</p>
               <p className="text-xs text-muted-foreground">Leaf scan complete</p>
             </div>
         </motion.div>
      </motion.div>
    </section>
  );
}

// ----------------------------------------------------------------------
// Features Section
// ----------------------------------------------------------------------
function FeaturesSection() {
  const features = [
    { icon: Droplets, title: 'Precision Irrigation', desc: 'Real-time moisture tracking prevents over-watering and conserves valuable resources automatically.' },
    { icon: ShieldCheck, title: 'AI Disease Detection', desc: 'Scan leaves using our vision models to immediately identify thousands of known plant pathogens.' },
    { icon: BarChart3, title: 'Predictive Analytics', desc: 'Interactive dashboards predict harvest yields and prescribe crop-specific nutrient cycles.' },
    { icon: Leaf, title: 'NPK Nutrient Flow', desc: 'Continuous telemetry on Nitrogen, Phosphorus, and Potassium ratios directly from the soil bed.' },
    { icon: Sprout, title: 'Yield Optimization', desc: 'Actionable recommendations formulated by analyzing environmental patterns against crop requirements.' },
    { icon: Activity, title: 'Real-Time Alerts', desc: 'Instant WebSocket-based notifications push critical agricultural threats directly to your devices.' },
  ];

  return (
    <section id="features" className="py-24 bg-card relative z-10 border-t border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-4">Enterprise Grade Tools</h2>
          <p className="text-muted-foreground text-lg">Everything you need to supervise, analyze, and automate your farming pipeline in one comprehensive suite.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} className="bg-background border border-border/50 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <f.icon strokeWidth={2.5} size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// How It Works
// ----------------------------------------------------------------------
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Deploy Hardware', desc: 'Install ESP32 sensor nodes in your soil.' },
    { num: '02', title: 'Connect to Cloud', desc: 'Sensors stream securely to the PrithviCore endpoint.' },
    { num: '03', title: 'Machine Learning', desc: 'Our algorithms process telemetry and disease images.' },
    { num: '04', title: 'Actionable Insights', desc: 'Adopt data-driven procedures to maximize yield.' }
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-[44px] left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-border via-primary/50 to-border -z-10" />
          
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-background border-4 border-card flex items-center justify-center text-2xl font-black text-primary shadow-xl shadow-primary/10 mb-6 group-hover:scale-110 transition-transform">
                {s.num}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm font-medium">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// Use Cases
// ----------------------------------------------------------------------
function UseCases() {
  const cases = [
    { title: 'Independent Farmers', icon: Sprout, desc: 'Optimize water usage and prevent crop failure on a budget. Get enterprise software without the enterprise price tag.' },
    { title: 'Agritech Organizations', icon: Factory, desc: 'Deploy massive sensor meshes across hundreds of acres with centralized monitoring and API access.' },
    { title: 'Research & Education', icon: Users, desc: 'Utilize historical NPK trends and continuous weather indexing for deep agronomic studies.' },
  ];

  return (
    <section id="use-cases" className="py-24 bg-card border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-6 leading-[1.1]">Built for Every Scale</h2>
            <p className="text-muted-foreground text-lg mb-8">From modest family plots to expansive automated greenhouses, PrithviCore's architecture dynamically scales with your canopy.</p>
            <Link href="/signup">
              <Button className="rounded-full shadow-lg bg-foreground text-background hover:bg-foreground/90 font-bold px-8 py-6 text-base group">
                Create Account <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-6">
             {cases.map((c, i) => (
               <div key={i} className="bg-background rounded-3xl p-6 border border-border shadow-sm hover:shadow-lg transition-shadow">
                 <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent-foreground mb-4">
                   <c.icon size={24} />
                 </div>
                 <h4 className="font-bold text-foreground text-lg mb-2">{c.title}</h4>
                 <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// Footer
// ----------------------------------------------------------------------
function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Leaf className="text-primary" size={24} />
          <span className="text-xl font-black tracking-tight text-foreground">PrithviCore</span>
        </div>
        <p className="text-sm text-muted-foreground font-medium">© {new Date().getFullYear()} PrithviCore Industries. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ----------------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <UseCases />
      <Footer />
    </div>
  );
}
