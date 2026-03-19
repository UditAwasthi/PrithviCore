'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Droplets, Sprout, ShieldCheck, BarChart3, Users, Factory, ArrowRight, Activity, Leaf, ChevronRight, Zap, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// ----------------------------------------------------------------------
// Landing Navbar
// ----------------------------------------------------------------------
function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground hidden sm:block">PrithviCore</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
          <a href="#use-cases" className="hover:text-foreground transition-colors">Use Cases</a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" className="font-medium hidden sm:inline-flex text-sm">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button className="font-semibold rounded-full px-5 text-sm shadow-lg shadow-emerald-500/20">
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
    <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden flex flex-col items-center text-center px-6">
      {/* Animated Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/8 dark:bg-emerald-500/5 rounded-full blur-[120px] -z-10 pointer-events-none animate-float" />
      <div className="absolute top-1/2 right-[-10%] w-[500px] h-[500px] bg-cyan-500/6 dark:bg-cyan-500/4 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] bg-violet-500/5 dark:bg-violet-500/3 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto z-10">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-border/40 bg-background/60 backdrop-blur-sm text-sm font-medium text-muted-foreground shadow-sm">
          <Zap size={14} className="text-emerald-500" />
          <span>AI-Powered Smart Farming Platform</span>
        </motion.div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[1.05] mb-6">
          The Intelligent OS for <br className="hidden md:block" />
          <span className="text-gradient">
            Modern Agriculture
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          Transform your farm into a premium, scalable eco-tech ecosystem. Harness real-time soil analytics, AI disease scanning, and actionable insights — all in one platform.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg" className="rounded-full shadow-xl shadow-emerald-500/20 w-full sm:w-auto px-8 py-6 text-base font-bold group">
              Start Free Trial <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto px-8 py-6 text-base font-semibold">
              Explore Platform
            </Button>
          </a>
        </div>
      </motion.div>

      {/* Animated Dashboard Mockup */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-20 relative w-full max-w-5xl mx-auto"
      >
         <div className="relative rounded-3xl border border-border/20 bg-card/30 backdrop-blur-2xl p-6 shadow-2xl shadow-emerald-500/5 overflow-hidden min-h-[420px] w-full flex flex-col gap-5 ring-1 ring-white/5">
           {/* Header Bar */}
           <div className="w-full h-11 flex items-center justify-between border-b border-border/30 pb-3">
             <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-red-400/80" />
               <div className="w-3 h-3 rounded-full bg-amber-400/80" />
               <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
             </div>
             <div className="h-5 w-28 bg-primary/15 rounded-full animate-pulse" />
           </div>
           
           <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
             {/* Chart Area */}
             <div className="col-span-2 flex flex-col gap-5">
               <div className="flex gap-5">
                 <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="flex-1 bg-background/40 backdrop-blur-sm rounded-2xl p-4 border border-border/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full" />
                   <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-3"><Leaf size={18} /></div>
                   <div className="w-10 h-2.5 bg-muted/60 rounded mb-2" />
                   <div className="w-20 h-4 bg-foreground/70 rounded" />
                 </motion.div>
                 <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3.5, delay: 0.5, repeat: Infinity, ease: "easeInOut" }} className="flex-1 bg-background/40 backdrop-blur-sm rounded-2xl p-4 border border-border/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 blur-2xl rounded-full" />
                   <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center mb-3"><Droplets size={18} /></div>
                   <div className="w-10 h-2.5 bg-muted/60 rounded mb-2" />
                   <div className="w-20 h-4 bg-foreground/70 rounded" />
                 </motion.div>
               </div>
               
               {/* Sparkline */}
               <div className="flex-1 bg-background/40 backdrop-blur-sm rounded-2xl border border-border/20 p-6 relative overflow-hidden flex flex-col justify-end">
                 <div className="absolute top-5 left-6 w-28 h-3.5 bg-muted/50 rounded" />
                 <svg className="w-full h-28 ml-2 -mb-1 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                   <motion.path 
                     d="M0,30 C20,25 30,10 50,20 C70,30 80,5 100,10" 
                     fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                     initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }} 
                   />
                   <motion.path 
                     d="M0,30 C20,25 30,10 50,20 C70,30 80,5 100,10 L100,40 L0,40 Z" 
                     fill="url(#heroGrad)" className="opacity-20"
                     initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} transition={{ duration: 1, delay: 1.5 }} 
                   />
                   <defs>
                     <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="currentColor" className="text-emerald-500" />
                       <stop offset="100%" stopColor="transparent" />
                     </linearGradient>
                   </defs>
                 </svg>
               </div>
             </div>
             
             {/* Side Panel */}
             <div className="col-span-1 flex flex-col gap-4">
               <div className="h-14 w-full bg-background/40 backdrop-blur-sm rounded-2xl border border-border/20 flex items-center p-3.5 gap-3">
                 <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center"><Activity size={16} /></div>
                 <div className="flex-1">
                   <div className="h-2.5 w-3/4 bg-foreground/50 rounded mb-1.5" />
                   <div className="h-2 w-1/2 bg-muted/50 rounded" />
                 </div>
               </div>
               
               <div className="flex-1 w-full bg-background/40 backdrop-blur-sm rounded-2xl border border-border/20 p-4 flex flex-col gap-3.5">
                 <div className="h-3 w-1/2 bg-muted/50 rounded" />
                 {[...Array(4)].map((_, i) => (
                   <motion.div key={i} animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity }} className="flex gap-3 items-center">
                     <div className="w-7 h-7 rounded-lg bg-border/30" />
                     <div className="flex-1 flex flex-col gap-1">
                       <div className="h-2 w-full bg-muted/60 rounded" />
                       <div className="h-2 w-3/4 bg-muted/30 rounded" />
                     </div>
                   </motion.div>
                 ))}
               </div>
             </div>
           </div>
         </div>

         {/* Floating notification card */}
         <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} 
           className="absolute -left-8 bottom-1/4 bg-background/90 backdrop-blur-xl border border-border/30 shadow-xl rounded-2xl p-3.5 flex items-center gap-3.5 hidden lg:flex ring-1 ring-white/10">
             <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500"><Activity size={18} /></div>
             <div>
               <p className="text-sm font-bold text-foreground">Disease Scan</p>
               <p className="text-xs text-muted-foreground">Leaf scan complete ✓</p>
             </div>
         </motion.div>
      </motion.div>

      {/* Trust Badges */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="mt-16 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground/60">
        {[
          { icon: Lock, text: 'SSL Encrypted' },
          { icon: Globe, text: 'Cloud Hosted' },
          { icon: Zap, text: 'Real-time Updates' },
        ].map((b, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <b.icon size={13} /> {b.text}
          </div>
        ))}
      </motion.div>
    </section>
  );
}

// ----------------------------------------------------------------------
// Features Section
// ----------------------------------------------------------------------
function FeaturesSection() {
  const features = [
    { icon: Droplets, title: 'Precision Irrigation', desc: 'Real-time moisture tracking prevents over-watering and conserves resources automatically.', color: 'from-cyan-500 to-blue-500' },
    { icon: ShieldCheck, title: 'AI Disease Detection', desc: 'Scan leaves to identify thousands of known plant pathogens using advanced vision models.', color: 'from-emerald-500 to-green-500' },
    { icon: BarChart3, title: 'Predictive Analytics', desc: 'Interactive dashboards predict harvest yields and prescribe crop-specific nutrient cycles.', color: 'from-violet-500 to-purple-500' },
    { icon: Leaf, title: 'NPK Nutrient Flow', desc: 'Continuous telemetry on Nitrogen, Phosphorus, and Potassium ratios from the soil bed.', color: 'from-lime-500 to-emerald-500' },
    { icon: Sprout, title: 'Yield Optimization', desc: 'Actionable recommendations by analyzing environmental patterns against crop requirements.', color: 'from-amber-500 to-orange-500' },
    { icon: Activity, title: 'Real-Time Alerts', desc: 'Instant WebSocket-based notifications push critical agricultural threats to your devices.', color: 'from-red-500 to-rose-500' },
  ];

  return (
    <section id="features" className="py-24 relative z-10 border-t border-border/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-4">Enterprise Grade Tools</h2>
          <p className="text-muted-foreground text-base md:text-lg">Everything you need to supervise, analyze, and automate your farming pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className="bg-background/60 backdrop-blur-sm border border-border/30 p-7 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group ring-1 ring-white/5 dark:ring-white/[0.02]">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <f.icon strokeWidth={2} size={22} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
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
    { num: '01', title: 'Deploy Sensors', desc: 'Install ESP32 sensor nodes in your soil bed.', icon: '📡' },
    { num: '02', title: 'Cloud Connect', desc: 'Sensors stream securely to the PrithviCore endpoint.', icon: '☁️' },
    { num: '03', title: 'AI Processing', desc: 'Our algorithms process telemetry and disease images.', icon: '🧠' },
    { num: '04', title: 'Take Action', desc: 'Adopt data-driven procedures to maximize yield.', icon: '🚀' }
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Four simple steps to transform your farm into a smart ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-[52px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent -z-10" />
          
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center text-center group">
              <div className="w-[90px] h-[90px] rounded-2xl bg-background/80 backdrop-blur-sm border border-border/30 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/5 mb-5 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-emerald-500/10 transition-all duration-300 ring-1 ring-white/10">
                {s.icon}
              </div>
              <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">{s.num}</div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// Stats Section
// ----------------------------------------------------------------------
function StatsSection() {
  const stats = [
    { value: '38+', label: 'Crop Diseases Detected' },
    { value: '7', label: 'Real-Time Soil Metrics' },
    { value: '99.9%', label: 'Platform Uptime' },
    { value: '<1s', label: 'Alert Response Time' },
  ];

  return (
    <section className="py-16 border-t border-b border-border/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <div className="text-3xl md:text-4xl font-black text-gradient mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
            </motion.div>
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
    { title: 'Independent Farmers', icon: Sprout, desc: 'Optimize water usage and prevent crop failure on a budget. Enterprise software without the enterprise price.' },
    { title: 'Agritech Organizations', icon: Factory, desc: 'Deploy massive sensor meshes across hundreds of acres with centralized monitoring and API access.' },
    { title: 'Research & Education', icon: Users, desc: 'Utilize historical NPK trends and continuous weather indexing for deep agronomic studies.' },
  ];

  return (
    <section id="use-cases" className="py-24 border-t border-border/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-5 leading-[1.1]">Built for Every Scale</h2>
            <p className="text-muted-foreground text-base mb-8">From modest family plots to expansive automated greenhouses, PrithviCore dynamically scales with your canopy.</p>
            <Link href="/signup">
              <Button className="rounded-full shadow-xl font-semibold px-7 py-5 text-sm group">
                Create Account <ChevronRight className="ml-1.5 group-hover:translate-x-1 transition-transform" size={16} />
              </Button>
            </Link>
          </div>
          <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-5">
             {cases.map((c, i) => (
               <motion.div key={i} whileHover={{ y: -4 }} className="bg-background/60 backdrop-blur-sm rounded-2xl p-6 border border-border/30 shadow-sm hover:shadow-lg transition-all duration-300 ring-1 ring-white/5">
                 <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center text-emerald-500 mb-4">
                   <c.icon size={22} />
                 </div>
                 <h4 className="font-bold text-foreground text-base mb-2">{c.title}</h4>
                 <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
               </motion.div>
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
    <footer className="border-t border-border/20 bg-background/80 backdrop-blur-sm py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center shadow-sm">
            <Leaf className="text-white" size={16} />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">PrithviCore</span>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} PrithviCore Industries. All rights reserved.</p>
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
      <StatsSection />
      <HowItWorks />
      <UseCases />
      <Footer />
    </div>
  );
}
