"use client"

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { BrainIcon, RadarIcon, ShieldAlertIcon, MapIcon } from '../icons/TheSvgIcons';

// 3D Tilt Card wrapper — disabled on touch devices
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);
  
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 200, damping: 30 });
  const glareX = useTransform(mouseX, [0, 1], [0, 100]);
  const glareY = useTransform(mouseY, [0, 1], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  // On touch devices, just render a simple wrapper (no tilt)
  if (isTouch) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      {children}
      {/* Glare overlay on hover */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useTransform(
            [glareX, glareY],
            ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
          ),
        }}
      />
    </motion.div>
  );
}

export default function BentoGrid() {
  const { t } = useTranslation();

  const features = [
    {
      title: t('landing.predictDontReact'),
      description: t('landing.predictDesc'),
      icon: <BrainIcon className="w-7 h-7 text-blue-400" />,
      className: "md:col-span-2 md:row-span-2",
      gradient: "from-blue-500/10 to-transparent",
      borderHover: "hover:border-blue-500/30",
      image: "/bento-prediction.png",
    },
    {
      title: t('landing.absoluteRealtime'),
      description: t('landing.realtimeDesc'),
      icon: <RadarIcon className="w-7 h-7 text-emerald-400" />,
      className: "md:col-span-1 md:row-span-1",
      gradient: "from-emerald-500/10 to-transparent",
      borderHover: "hover:border-emerald-500/30",
      image: "/bento-realtime.png",
    },
    {
      title: t('landing.emergencyRouting'),
      description: t('landing.emergencyRoutingDesc'),
      icon: <ShieldAlertIcon className="w-7 h-7 text-rose-400" />,
      className: "md:col-span-1 md:row-span-1",
      gradient: "from-rose-500/10 to-transparent",
      borderHover: "hover:border-rose-500/30",
      image: "/bento-emergency.png",
    },
    {
      title: t('landing.fullDigitalTwin'),
      description: t('landing.digitalTwinDesc'),
      icon: <MapIcon className="w-7 h-7 text-purple-400" />,
      className: "md:col-span-3 md:row-span-1",
      gradient: "from-purple-500/10 to-transparent",
      borderHover: "hover:border-purple-500/30",
      image: "/bento-twin.png",
    }
  ];

  // Stagger container variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      filter: "blur(10px)",
    },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <section id="features" className="relative py-32">
      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold font-heading mb-6 text-foreground"
          >
            {t('landing.powerOfPrediction')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              {t('landing.prediction')}
            </span>
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             className="text-lg text-muted-foreground"
          >
            {t('landing.bentoSubtitle')}
          </motion.p>
        </div>

        {/* Grid Layout with Stagger */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-5 md:auto-rows-[280px]"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, idx) => (
            <motion.div key={idx} variants={cardVariants} whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }} className={feature.className}>
              <TiltCard
                className={`group relative rounded-3xl border border-border overflow-hidden backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 ${feature.borderHover} h-full animated-border`}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image 
                    src={feature.image} 
                    alt={feature.title} 
                    fill 
                    className="object-cover opacity-30 dark:opacity-40 group-hover:opacity-40 dark:group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" 
                    unoptimized 
                  />
                  {/* Strong overlay to ensure text readability */}
                  <div className="absolute inset-0 bg-background/40 dark:bg-transparent" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} from-background via-background/95 to-background/30`} />
                </div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-8">
                  <div className="mb-4 p-3 rounded-2xl bg-secondary/50 w-fit border border-border shadow-lg backdrop-blur-sm">
                    {feature.icon}
                  </div>
                  <div className="mt-auto">
                      <h3 className="text-xl md:text-2xl font-bold font-heading text-foreground mb-2 tracking-wide">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm font-medium">{feature.description}</p>
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
