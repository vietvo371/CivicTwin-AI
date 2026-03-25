"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { BrainIcon, RadarIcon, ShieldAlertIcon, MapIcon, ZapIcon, SearchCheckIcon, DatabaseIcon, BarChartIcon } from "../icons/TheSvgIcons";

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      step: "01",
      title: t('landing.step01Title'),
      description: t('landing.step01Desc'),
      icon: <DatabaseIcon className="w-7 h-7" />,
      color: "text-blue-400",
      borderColor: "border-blue-500/30",
      bgGlow: "bg-blue-500/10",
      visual: (
        <div className="grid grid-cols-3 gap-2 w-full">
          {[
            t('landing.cameraFeed'), t('landing.floodSensor'), t('landing.weatherAPI'),
            t('landing.mqttStream'), t('landing.citizenApp'), t('landing.gpsProbe')
          ].map((s, i) => (
            <div key={i} className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-mono text-center truncate">{s}</div>
          ))}
        </div>
      ),
    },
    {
      step: "02",
      title: t('landing.step02Title'),
      description: t('landing.step02Desc'),
      icon: <BrainIcon className="w-7 h-7" />,
      color: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgGlow: "bg-purple-500/10",
      visual: (
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex-1 space-y-2">
            {[85, 62, 94, 45].map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-purple-500/20 flex-1 animate-shimmer">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${v}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: i * 0.15 }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  />
                </div>
                <span className="text-[10px] font-mono text-purple-300 w-8">{v}%</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      step: "03",
      title: t('landing.step03Title'),
      description: t('landing.step03Desc'),
      icon: <MapIcon className="w-7 h-7" />,
      color: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgGlow: "bg-emerald-500/10",
      visual: (
        <div className="relative w-full h-16">
          <svg viewBox="0 0 300 60" className="w-full h-full">
            <path d="M0,40 Q50,10 100,30 T200,20 T300,35" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="6"/>
            <path d="M0,45 Q50,50 100,42 T200,48 T300,40" fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="100" cy="30" r="4" fill="#10b981" className="animate-pulse"/>
            <circle cx="200" cy="20" r="3" fill="#f59e0b"/>
            <text x="105" y="25" fill="#10b981" fontSize="8" fontFamily="monospace">Optimal</text>
          </svg>
        </div>
      ),
    },
    {
      step: "04",
      title: t('landing.step04Title'),
      description: t('landing.step04Desc'),
      icon: <ZapIcon className="w-7 h-7" />,
      color: "text-amber-400",
      borderColor: "border-amber-500/30",
      bgGlow: "bg-amber-500/10",
      visual: (
        <div className="flex gap-2 w-full flex-wrap">
          {[
            { label: t('landing.signalOptimized'), dot: "bg-emerald-500" },
            { label: t('landing.greenWaveActive'), dot: "bg-blue-500" },
            { label: t('landing.citizensNotified'), dot: "bg-amber-500" },
            { label: t('landing.routesUpdated'), dot: "bg-purple-500" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-[11px] font-medium text-muted-foreground"
            >
              <span className={`w-2 h-2 rounded-full ${item.dot} animate-pulse`}></span>
              {item.label}
            </motion.div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section className="relative py-32">
      <div className="container max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold font-heading mb-6 text-foreground"
          >
            {t('landing.howIt')}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              {t('landing.works')}
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {t('landing.howItWorksSubtitle')}
          </motion.p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-[2px] bg-secondary/80" />

          <div className="space-y-16 md:space-y-24">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`relative flex flex-col md:flex-row items-start gap-8 md:gap-16 ${
                  idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-20">
                  <div className={`w-10 h-10 rounded-full ${step.bgGlow} border-2 ${step.borderColor} flex items-center justify-center backdrop-blur-md shadow-lg`}>
                    <span className={step.color}>{step.icon}</span>
                  </div>
                </div>

                {/* Content Card */}
                <div className={`ml-20 md:ml-0 md:w-[calc(50%-3rem)] ${idx % 2 === 0 ? "md:pr-4" : "md:pl-4"}`}>
                  <div className={`rounded-2xl border ${step.borderColor} bg-card/60 backdrop-blur-md p-6 hover:bg-card/80 transition-all hover:shadow-xl group`}>
                    {/* Step Number */}
                    <div className={`text-xs font-bold ${step.color} uppercase tracking-[0.3em] mb-3`}>
                      {t('landing.step')} {step.step}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-bold font-heading text-foreground mb-3 tracking-wide">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed text-sm mb-5">
                      {step.description}
                    </p>

                    {/* Mini Visual */}
                    <div className="pt-4 border-t border-border/50">
                      {step.visual}
                    </div>
                  </div>
                </div>

                {/* Spacer for the other side */}
                <div className="hidden md:block md:w-[calc(50%-3rem)]" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
