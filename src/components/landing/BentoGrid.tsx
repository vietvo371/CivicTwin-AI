"use client"

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { BrainIcon, RadarIcon, ShieldAlertIcon, MapIcon } from '../icons/TheSvgIcons';

/* ── TiltCard with glow border ── */
function TiltCard({ children, className, glowColor = "blue" }: { children: React.ReactNode; className?: string; glowColor?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => { setIsTouch(window.matchMedia('(pointer: coarse)').matches); }, []);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [5, -5]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), { stiffness: 200, damping: 30 });
  const glareX = useTransform(mouseX, [0, 1], [0, 100]);
  const glareY = useTransform(mouseY, [0, 1], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };
  const handleMouseLeave = () => { mouseX.set(0.5); mouseY.set(0.5); };

  if (isTouch) return <div className={className}>{children}</div>;

  return (
    <motion.div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800, transformStyle: 'preserve-3d' }} className={className}>
      {children}
      <motion.div className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: useTransform([glareX, glareY], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.12) 0%, transparent 50%)`) }} />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   ── RICH ANIMATED VISUALIZATIONS ──
   Highly visible, not faded — designed to impress
   ═══════════════════════════════════════════════ */

function PredictionChartViz() {
  return (
    <div className="absolute inset-0 flex items-end overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-1/4 left-1/3 w-1/2 h-1/2 bg-blue-500/20 rounded-full blur-[60px]" />
      <svg viewBox="0 0 400 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* Grid lines */}
        {[30, 60, 90, 120, 150].map(y => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#3b82f620" strokeWidth="0.5" />
        ))}
        {[50, 100, 150, 200, 250, 300, 350].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="180" stroke="#3b82f615" strokeWidth="0.5" />
        ))}
        {/* Area fill under actual line */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <path d="M0,140 Q40,120 80,110 T160,85 T240,60 T320,70 T400,45 L400,180 L0,180 Z" fill="url(#areaGrad)">
          <animate attributeName="opacity" values="0;1" dur="1.5s" fill="freeze" />
        </path>
        {/* Actual line — thick, visible */}
        <path d="M0,140 Q40,120 80,110 T160,85 T240,60 T320,70 T400,45" fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round">
          <animate attributeName="stroke-dasharray" from="0,1000" to="1000,0" dur="2s" fill="freeze" />
        </path>
        {/* Predicted line (dashed, brighter) */}
        <path d="M0,145 Q40,130 80,118 T160,95 T240,70 T320,78 T400,55" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="8,6" strokeLinecap="round" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="800" to="0" dur="3s" fill="freeze" />
        </path>
        {/* Data points with glow */}
        {[[80,110],[160,85],[240,60],[320,70]].map(([cx,cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="8" fill="#3b82f6" opacity="0.15">
              <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
            </circle>
            <circle cx={cx} cy={cy} r="4" fill="#3b82f6" stroke="#1e3a5f" strokeWidth="1.5">
              <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${0.8 + i * 0.3}s`} fill="freeze" />
            </circle>
          </g>
        ))}
        {/* Live indicator */}
        <rect x="310" y="15" width="75" height="24" rx="12" fill="#3b82f630" stroke="#3b82f650" strokeWidth="1" />
        <circle cx="325" cy="27" r="3" fill="#3b82f6">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text x="337" y="32" fill="#93c5fd" fontSize="10" fontWeight="600" fontFamily="monospace">LSTM</text>
      </svg>
    </div>
  );
}

function RealtimePulseViz() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-2/3 h-2/3 bg-emerald-500/15 rounded-full blur-[50px]" />
      <svg viewBox="0 0 200 200" className="w-full h-full p-3">
        {/* Road network */}
        <line x1="20" y1="100" x2="180" y2="100" stroke="#10b98130" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="20" x2="100" y2="180" stroke="#10b98130" strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="30" x2="170" y2="170" stroke="#10b98120" strokeWidth="2" strokeLinecap="round" />
        <line x1="170" y1="30" x2="30" y2="170" stroke="#10b98120" strokeWidth="2" strokeLinecap="round" />
        {/* Intersection circle */}
        <circle cx="100" cy="100" r="12" fill="none" stroke="#10b98140" strokeWidth="1.5" strokeDasharray="4,3" />
        {/* Vehicle dots — bright and animated */}
        {[
          [50,100,'#10b981',1.2],[150,100,'#eab308',1.5],[100,50,'#10b981',1.8],
          [100,150,'#ef4444',1.3],[60,60,'#10b981',2.0],[140,140,'#eab308',1.6],
          [140,60,'#10b981',1.4],[60,140,'#ef4444',1.7],
        ].map(([cx,cy,color,dur], i) => (
          <g key={i}>
            <circle cx={cx as number} cy={cy as number} r="10" fill={color as string} opacity="0.1">
              <animate attributeName="r" values="6;14;6" dur={`${dur}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.05;0.15" dur={`${dur}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={cx as number} cy={cy as number} r="4" fill={color as string} opacity="0.9">
              <animate attributeName="r" values="3;5;3" dur={`${dur}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        {/* Live badge */}
        <rect x="130" y="10" width="60" height="22" rx="11" fill="#10b98130" stroke="#10b98150" strokeWidth="1" />
        <circle cx="144" cy="21" r="3" fill="#10b981">
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <text x="154" y="25" fill="#6ee7b7" fontSize="9" fontWeight="700" fontFamily="monospace">LIVE</text>
      </svg>
    </div>
  );
}

function EmergencyRouteViz() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/10 rounded-full blur-[40px]" />
      <svg viewBox="0 0 200 200" className="w-full h-full p-3">
        {/* Alternative routes (muted) */}
        <path d="M30,170 Q60,100 100,90 Q140,80 170,30" fill="none" stroke="#ffffff15" strokeWidth="2" strokeDasharray="5,5" />
        <path d="M30,170 Q80,140 120,110 Q150,90 170,30" fill="none" stroke="#ffffff15" strokeWidth="2" strokeDasharray="5,5" />
        {/* Main optimal route — bright green */}
        <path d="M30,170 Q70,120 110,100 Q145,85 170,30" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" opacity="0.9">
          <animate attributeName="stroke-dasharray" from="0,500" to="500,0" dur="1.5s" fill="freeze" />
        </path>
        {/* Route glow */}
        <path d="M30,170 Q70,120 110,100 Q145,85 170,30" fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" opacity="0.1" />
        {/* Traveling ambulance dot with trail */}
        <circle r="6" fill="#10b981">
          <animateMotion dur="3s" repeatCount="indefinite" path="M30,170 Q70,120 110,100 Q145,85 170,30" />
        </circle>
        <circle r="12" fill="#10b981" opacity="0.2">
          <animateMotion dur="3s" repeatCount="indefinite" path="M30,170 Q70,120 110,100 Q145,85 170,30" />
          <animate attributeName="r" values="8;16;8" dur="1s" repeatCount="indefinite" />
        </circle>
        {/* Start — red */}
        <circle cx="30" cy="170" r="8" fill="#ef4444" opacity="0.9" />
        <circle cx="30" cy="170" r="14" fill="#ef4444" opacity="0.15">
          <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="30" y="195" textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="700">SOS</text>
        {/* End — blue hospital */}
        <circle cx="170" cy="30" r="8" fill="#3b82f6" opacity="0.9" />
        <circle cx="170" cy="30" r="14" fill="#3b82f6" opacity="0.15">
          <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="170" y="18" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="700">HOSPITAL</text>
      </svg>
    </div>
  );
}

function DigitalTwinViz() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/4 w-1/2 h-1/2 bg-purple-500/15 rounded-full blur-[60px]" />
      <div className="w-full h-full" style={{ perspective: '600px' }}>
        <svg viewBox="0 0 500 120" className="w-full h-full" style={{ transform: 'rotateX(25deg) rotateZ(-3deg) translateY(10%)' }}>
          {/* Grid */}
          {Array.from({ length: 21 }, (_, i) => (
            <line key={`v${i}`} x1={i * 25} y1="0" x2={i * 25} y2="120" stroke="#a855f720" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="500" y2={i * 20} stroke="#a855f720" strokeWidth="0.5" />
          ))}
          {/* City blocks — glowing */}
          {[
            [25,15,40,25,'#a855f7'],[100,50,35,20,'#8b5cf6'],[175,10,50,25,'#a855f7'],
            [270,45,30,20,'#7c3aed'],[340,15,45,25,'#a855f7'],[420,40,40,20,'#8b5cf6'],
            [50,70,30,18,'#7c3aed'],[200,75,45,20,'#a855f7'],[350,70,35,22,'#8b5cf6'],
          ].map(([x,y,w,h,color], i) => (
            <g key={i}>
              <rect x={x as number} y={y as number} width={w as number} height={h as number} rx="3"
                fill={`${color}15`} stroke={`${color}40`} strokeWidth="1">
                <animate attributeName="opacity" values="0.4;0.9;0.4" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
              </rect>
              {/* Top edge glow */}
              <line x1={x as number} y1={y as number} x2={(x as number) + (w as number)} y2={y as number}
                stroke={color as string} strokeWidth="1.5" opacity="0.5" />
            </g>
          ))}
          {/* Moving vehicles */}
          {[0, 1, 2, 3, 4].map(i => (
            <g key={`v${i}`}>
              <circle r="2.5" fill="#c084fc" opacity="0.9">
                <animate attributeName="cx" from={i % 2 === 0 ? "0" : "500"} to={i % 2 === 0 ? "500" : "0"} dur={`${3.5 + i * 0.8}s`} repeatCount="indefinite" />
                <animate attributeName="cy" values={`${15 + i * 22};${20 + i * 22};${15 + i * 22}`} dur={`${3.5 + i * 0.8}s`} repeatCount="indefinite" />
              </circle>
              <circle r="6" fill="#c084fc" opacity="0.15">
                <animate attributeName="cx" from={i % 2 === 0 ? "0" : "500"} to={i % 2 === 0 ? "500" : "0"} dur={`${3.5 + i * 0.8}s`} repeatCount="indefinite" />
                <animate attributeName="cy" values={`${15 + i * 22};${20 + i * 22};${15 + i * 22}`} dur={`${3.5 + i * 0.8}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
          {/* "1:1 SCALE" label */}
          <rect x="420" y="90" width="70" height="22" rx="4" fill="#a855f720" stroke="#a855f740" strokeWidth="1" />
          <text x="455" y="105" textAnchor="middle" fill="#c4b5fd" fontSize="9" fontWeight="700" fontFamily="monospace">1:1 GIS</text>
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ── MAIN BENTO GRID COMPONENT ──
   ═══════════════════════════════════════ */

export default function BentoGrid() {
  const { t } = useTranslation();

  const features = [
    {
      title: t('landing.predictDontReact'),
      description: t('landing.predictDesc'),
      icon: <BrainIcon className="w-6 h-6 text-blue-400" />,
      className: "md:col-span-2 md:row-span-2",
      glowColor: "blue",
      borderColor: "border-blue-500/20 hover:border-blue-500/50",
      shadowColor: "hover:shadow-blue-500/20",
      gradientOverlay: "from-background via-background/80 to-transparent",
      viz: <PredictionChartViz />,
    },
    {
      title: t('landing.absoluteRealtime'),
      description: t('landing.realtimeDesc'),
      icon: <RadarIcon className="w-6 h-6 text-emerald-400" />,
      className: "md:col-span-1 md:row-span-1",
      glowColor: "emerald",
      borderColor: "border-emerald-500/20 hover:border-emerald-500/50",
      shadowColor: "hover:shadow-emerald-500/20",
      gradientOverlay: "from-background via-background/80 to-transparent",
      viz: <RealtimePulseViz />,
    },
    {
      title: t('landing.emergencyRouting'),
      description: t('landing.emergencyRoutingDesc'),
      icon: <ShieldAlertIcon className="w-6 h-6 text-rose-400" />,
      className: "md:col-span-1 md:row-span-1",
      glowColor: "rose",
      borderColor: "border-rose-500/20 hover:border-rose-500/50",
      shadowColor: "hover:shadow-rose-500/20",
      gradientOverlay: "from-background via-background/80 to-transparent",
      viz: <EmergencyRouteViz />,
    },
    {
      title: t('landing.fullDigitalTwin'),
      description: t('landing.digitalTwinDesc'),
      icon: <MapIcon className="w-6 h-6 text-purple-400" />,
      className: "md:col-span-3 md:row-span-1",
      glowColor: "purple",
      borderColor: "border-purple-500/20 hover:border-purple-500/50",
      shadowColor: "hover:shadow-purple-500/20",
      gradientOverlay: "from-background via-background/70 to-transparent",
      viz: <DigitalTwinViz />,
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <section id="features" className="relative py-32">
      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold font-heading mb-6 text-foreground"
          >
            {t('landing.powerOfPrediction')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{t('landing.prediction')}</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground">
            {t('landing.bentoSubtitle')}
          </motion.p>
        </div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:auto-rows-[280px]"
          variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
          {features.map((feature, idx) => (
            <motion.div key={idx} variants={cardVariants} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300 }} className={feature.className}>
              <TiltCard
                glowColor={feature.glowColor}
                className={`group relative rounded-3xl border ${feature.borderColor} overflow-hidden bg-card/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl ${feature.shadowColor} h-full`}
              >
                {/* ▸ Animated SVG Visualization — FULL VISIBILITY */}
                {feature.viz}

                {/* ▸ Bottom gradient — only covers text area */}
                <div className={`absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t ${feature.gradientOverlay}`} />

                {/* ▸ Content — pinned to bottom */}
                <div className="relative z-10 flex flex-col h-full p-7">
                  <div className="mb-3 p-2.5 rounded-xl bg-background/60 w-fit border border-border/50 shadow-lg backdrop-blur-sm">
                    {feature.icon}
                  </div>
                  <div className="mt-auto">
                    <h3 className="text-lg md:text-xl font-bold font-heading text-foreground mb-1.5">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
