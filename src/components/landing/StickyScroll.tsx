"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

function TextSection({ title, description, progress, range }: { title: string, description: string, progress: any, range: number[] }) {
  const opacity = useTransform(progress, range, [0, 1, 0]);
  const y = useTransform(progress, range, [40, 0, -40]);
  
  return (
    <motion.div 
      style={{ opacity, y }}
      className="absolute inset-y-0 flex flex-col justify-center pointer-events-none"
    >
      <h3 className="text-3xl lg:text-4xl font-bold font-heading mb-4 text-foreground">{title}</h3>
      <p className="text-lg text-muted-foreground leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}

function ImageSection({ image, progress, range }: { image: React.ReactNode, progress: any, range: number[] }) {
  const opacity = useTransform(progress, range, [0, 1, 0]);
  const scale = useTransform(progress, range, [0.9, 1, 0.9]);

  return (
    <motion.div 
       style={{ opacity, scale }}
       className="absolute inset-0 flex items-center justify-center p-4 lg:p-0"
    >
      {image}
    </motion.div>
  );
}

export default function StickyScroll() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const content = [
    {
      title: t('landing.stickyTitle1'),
      description: t('landing.stickyDesc1'),
      image: (
        <div className="h-full w-full bg-background rounded-2xl border border-border flex items-center justify-center p-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl"></div>
          <div className="relative w-full h-full border border-blue-500/20 rounded-xl overflow-hidden bg-card">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(239,68,68,0.3)_0,transparent_40%)]"></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(59,130,246,0.3)_0,transparent_40%)]"></div>
             <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0,50 Q25,20 50,50 T100,50" fill="none" stroke="#3b82f6" strokeWidth="1" />
               <path d="M0,70 Q25,40 50,70 T100,70" fill="none" stroke="#ef4444" strokeWidth="2" />
             </svg>
          </div>
        </div>
      )
    },
    {
      title: t('landing.stickyTitle2'),
      description: t('landing.stickyDesc2'),
      image: (
        <div className="h-full w-full bg-background rounded-2xl border border-border flex items-center justify-center p-8 overflow-hidden relative">
           <div className="absolute inset-0 bg-emerald-500/10 blur-3xl"></div>
           <div className="relative w-full h-full border border-emerald-500/20 rounded-xl overflow-hidden bg-card p-6 flex flex-col justify-center">
               <div className="h-4 w-32 bg-secondary rounded-full mb-4"></div>
               <div className="h-2 w-full bg-secondary rounded-full mb-2"></div>
               <div className="h-2 w-3/4 bg-secondary rounded-full mb-8"></div>
               <div className="relative h-20 w-full border-t-2 border-dashed border-border mt-4">
                   <div className="absolute top-[-5px] left-0 w-2 h-2 rounded-full bg-blue-500"></div>
                   <div className="absolute top-[-5px] right-0 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                   <div className="absolute top-[-6px] left-[30%] w-4 h-2 rounded-full bg-emerald-400"></div>
               </div>
           </div>
        </div>
      )
    },
    {
      title: t('landing.stickyTitle3'),
      description: t('landing.stickyDesc3'),
      image: (
        <div className="h-full w-full bg-background rounded-2xl border border-border flex items-center justify-center p-8 overflow-hidden relative">
           <div className="absolute inset-0 bg-purple-500/10 blur-3xl"></div>
           <div className="relative w-full h-full border border-purple-500/20 rounded-xl overflow-hidden bg-card font-mono text-purple-400 text-sm p-4 flex flex-col items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-32 h-32 stroke-purple-500/50 hover:stroke-purple-400 transition-colors" fill="none" strokeWidth="1">
                 <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" />
                 <line x1="50" y1="10" x2="50" y2="50" />
                 <line x1="90" y1="30" x2="50" y2="50" />
                 <line x1="10" y1="30" x2="50" y2="50" />
                 <line x1="50" y1="90" x2="50" y2="50" />
              </svg>
           </div>
        </div>
      )
    }
  ];

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-transparent">
      <div className="sticky top-0 h-screen flex items-center">
        <div className="container max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          
          <div className="flex flex-col justify-center relative">
             <div className="absolute top-0 bottom-0 left-0 w-1 bg-secondary/50 rounded-full">
                <motion.div 
                   style={{ scaleY: scrollYProgress, originY: 0 }}
                   className="w-full h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                />
             </div>
             
             <div className="pl-8 relative h-[400px]">
                {content.map((item, index) => {
                  const itemLength = 1 / content.length;
                  const start = index * itemLength;
                  const center = start + itemLength / 2;
                  const end = start + itemLength;
                  
                  return (
                    <TextSection 
                      key={index} 
                      title={item.title} 
                      description={item.description} 
                      progress={scrollYProgress} 
                      range={[start, center, end]} 
                    />
                  );
                })}
             </div>
          </div>

          <div className="hidden lg:flex flex-col justify-center h-[500px]">
             <motion.div className="w-full h-full relative">
                {content.map((item, index) => {
                  const itemLength = 1 / content.length;
                  const start = index * itemLength;
                  const center = start + itemLength / 2;
                  const end = start + itemLength;

                  return (
                    <ImageSection 
                      key={index}
                      image={item.image}
                      progress={scrollYProgress}
                      range={[start, center, end]}
                    />
                  )
                })}
             </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
