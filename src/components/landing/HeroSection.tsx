"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, animate, useMotionValue, useSpring } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ZapIcon } from 'lucide-react';
import { RadarIcon } from '../icons/TheSvgIcons';

// Animated Counter Component
function AnimatedCounter({ value, suffix = '', duration = 2 }: { value: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const numericPart = value.replace(/[^0-9.]/g, '');
    const prefix = value.replace(/[0-9.].*/g, '');
    const num = parseFloat(numericPart);
    if (isNaN(num)) { setDisplayValue(value); return; }
    const controls = animate(0, num, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplayValue(Number.isInteger(num) ? `${prefix}${Math.round(v)}${suffix}` : `${prefix}${v.toFixed(1)}${suffix}`);
      },
    });
    return () => controls.stop();
  }, [isInView, value, suffix, duration]);

  return <span ref={ref}>{displayValue}</span>;
}

// Typing Effect Component
function TypingText({ text, speed = 50 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else { setDone(true); clearInterval(interval); }
    }, speed);
    return () => clearInterval(interval);
  }, [isInView, text, speed]);

  return (
    <span ref={ref}>
      {displayed}
      {!done && <span className="animate-typing-cursor ml-0.5">&nbsp;</span>}
    </span>
  );
}

// Floating Particles — client-only
function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; y: number; size: number; duration: number; delay: number; color: string;
  }>>([]);

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 10 : 25;
    setParticles(Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 6 + 6,
      delay: Math.random() * 4,
      color: ['bg-blue-400', 'bg-indigo-400', 'bg-emerald-400', 'bg-purple-400'][Math.floor(Math.random() * 4)],
    })));
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.color} animate-float-particle`}
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            '--duration': `${p.duration}s`, '--delay': `${p.delay}s`,
            filter: `blur(${p.size > 4 ? 1 : 0}px)`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// Cursor Spotlight — follows mouse
function CursorSpotlight() {
  const [mounted, setMounted] = useState(false);
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const springX = useSpring(x, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  useEffect(() => {
    setMounted(true);
    const handleMouse = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [x, y]);

  if (!mounted) return null;

  return (
    <motion.div
      className="cursor-spotlight hidden md:block"
      style={{ left: springX, top: springY }}
    />
  );
}

// Magnetic Button — follows cursor on hover
function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.3);
    y.set((e.clientY - cy) * 0.3);
  }, [x, y]);

  const handleLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      className={`magnetic-btn ${className || ''}`}
    >
      {children}
    </motion.div>
  );
}

// Word-by-word stagger reveal
function WordReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, rotateX: -40, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.08,
            ease: "easeOut" as const,
          }}
          className="inline-block mr-[0.3em]"
          style={{ transformOrigin: "bottom", perspective: "500px" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export default function HeroSection() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scaleText = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const badgeText = t('landing.badgeText');

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-32"
    >
      {/* Cursor Spotlight */}
      <CursorSpotlight />

      {/* Aurora Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="aurora-bg" />
      </div>

      {/* Background Layers + Floating Particles */}
      <motion.div style={{ y: yBg }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[70vw] h-[70vw] lg:w-[40vw] lg:h-[40vw] bg-emerald-500/10 rounded-full blur-[120px] dark:mix-blend-screen" />
        <div className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[100px] dark:mix-blend-screen" />
        <div className="absolute top-[10%] right-[20%] w-[40vw] h-[40vw] bg-purple-500/10 rounded-full blur-[100px] dark:mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <FloatingParticles />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-6 text-center">
        
        {/* Pill Badge with Typing Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" as const, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 uppercase tracking-widest backdrop-blur-md animate-glow-pulse"
        >
          <ZapIcon className="w-4 h-4 text-emerald-400" />
          <TypingText text={badgeText} speed={35} />
        </motion.div>

        {/* Big Bold Headline — Word by Word Reveal */}
        <motion.h1 
          style={{ opacity: opacityText, scale: scaleText }}
          className="text-5xl md:text-7xl lg:text-[84px] font-extrabold tracking-tight font-heading leading-tight md:leading-[1.1]"
        >
          <span className="text-foreground">
            <WordReveal text={t('landing.heroLine1')} delay={0.3} />
          </span>
          <br/>
          <motion.span 
            initial={{ opacity: 0, filter: "blur(12px)", scale: 0.9 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"
          >
            {t('landing.heroLine2')}
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-medium leading-relaxed"
        >
          {t('landing.heroSubtitle')}
        </motion.p>

        {/* CTA Buttons with Magnetic Effect */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <MagneticButton>
            <Link href="/map">
              <Button size="lg" className="h-14 px-10 text-base font-bold bg-foreground text-background border-none hover:opacity-90 transition-all rounded-full shadow-lg animate-glow-pulse cursor-pointer">
                {t('landing.viewLiveMap')}
              </Button>
            </Link>
          </MagneticButton>

          <MagneticButton>
            <button onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }} className="w-full sm:w-auto px-10 py-4 rounded-full bg-secondary/50 hover:bg-secondary border border-border font-bold tracking-wide transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer">
              {t('landing.exploreFeatures')}
              <RadarIcon className="w-5 h-5" />
            </button>
          </MagneticButton>
        </motion.div>

        {/* Live Stats Row with Animated Counters */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.8 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {[
            { value: "60", suffix: "min", label: t('landing.predictionAhead'), color: "text-blue-400" },
            { value: "<1", suffix: "s", label: t('landing.responseTime'), color: "text-emerald-400" },
            { value: "100", suffix: "k+", label: t('landing.eventsPerSecond'), color: "text-purple-400" },
            { value: "1:1", suffix: "", label: t('landing.digitalTwinScale'), color: "text-amber-400" },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-2xl bg-secondary/30 border border-border/50 hover:border-border transition-all hover:shadow-lg cursor-default"
            >
              <div className={`text-3xl md:text-4xl font-black font-heading ${stat.color}`}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1.5 + i * 0.3} />
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
