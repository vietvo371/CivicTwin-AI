"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { DatabaseIcon, BrainIcon, MapIcon, ZapIcon } from "../icons/TheSvgIcons";

/* ── Mini Visualizations — consistent 80px height ── */

function DataStreamViz() {
  return (
    <div className="relative w-full h-20 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 overflow-hidden border border-blue-500/10">
      <svg viewBox="0 0 200 60" className="w-full h-full">
        {[12, 24, 36, 48].map((y, i) => (
          <g key={i}>
            <line x1="0" y1={y} x2="200" y2={y} stroke="#3b82f6" strokeWidth="0.4" opacity="0.2" />
            {[0, 1, 2, 3].map((j) => (
              <circle key={j} r="2.5" cy={y} fill="#3b82f6" opacity="0.8">
                <animate attributeName="cx" from="-10" to="210" dur={`${2 + i * 0.3}s`} begin={`${j * 0.5 + i * 0.2}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.8;0.8;0" dur={`${2 + i * 0.3}s`} begin={`${j * 0.5 + i * 0.2}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        ))}
        <path d="M155,5 L185,25 L185,35 L155,55 Z" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.4" />
        <path d="M185,25 L198,28 L198,32 L185,35 Z" fill="#3b82f6" opacity="0.3" />
      </svg>
    </div>
  );
}

function NeuralNetViz() {
  const nodes = [
    { x: 25, y: 12 }, { x: 25, y: 30 }, { x: 25, y: 48 },
    { x: 70, y: 16 }, { x: 70, y: 34 }, { x: 70, y: 52 },
    { x: 115, y: 22 }, { x: 115, y: 40 },
    { x: 160, y: 30 },
  ];
  const connections = [
    [0,3],[0,4],[0,5],[1,3],[1,4],[1,5],[2,3],[2,4],[2,5],
    [3,6],[3,7],[4,6],[4,7],[5,6],[5,7],[6,8],[7,8],
  ];

  return (
    <div className="relative w-full h-20 rounded-xl bg-purple-500/5 dark:bg-purple-500/10 overflow-hidden border border-purple-500/10">
      <svg viewBox="0 0 185 60" className="w-full h-full">
        {connections.map(([from, to], i) => (
          <line key={i} x1={nodes[from].x} y1={nodes[from].y} x2={nodes[to].x} y2={nodes[to].y}
            stroke="#a855f7" strokeWidth="0.6" opacity="0.25" />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="6" fill="#a855f7" opacity="0.1">
              <animate attributeName="r" values="4;8;4" dur="2.5s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={n.x} cy={n.y} r="4" fill="#a855f7" opacity="0.85">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

function SimulationViz() {
  const bars = [
    { before: 35, after: 65 },
    { before: 50, after: 72 },
    { before: 25, after: 48 },
    { before: 60, after: 85 },
    { before: 40, after: 58 },
  ];
  return (
    <div className="relative w-full h-20 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 overflow-hidden border border-emerald-500/10 flex items-end gap-2 px-4 pb-2.5 pt-3">
      {bars.map((bar, i) => (
        <div key={i} className="flex-1 flex gap-1 items-end h-full">
          <motion.div
            initial={{ height: 0 }}
            whileInView={{ height: `${bar.before}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.08 }}
            className="flex-1 rounded-t bg-emerald-500/25"
          />
          <motion.div
            initial={{ height: 0 }}
            whileInView={{ height: `${bar.after}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 + i * 0.08 }}
            className="flex-1 rounded-t bg-emerald-400"
          />
        </div>
      ))}
    </div>
  );
}

function DeployViz() {
  const { t } = useTranslation();
  const items = [
    { label: t('landing.signalOptimized'), dot: "bg-emerald-500" },
    { label: t('landing.greenWaveActive'), dot: "bg-blue-500" },
    { label: t('landing.citizensNotified'), dot: "bg-amber-500" },
    { label: t('landing.routesUpdated'), dot: "bg-purple-500" },
  ];
  return (
    <div className="w-full h-20 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 grid grid-cols-2 gap-1.5 p-2 overflow-hidden">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.1 }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80 border border-border/50 text-[10px] font-semibold text-muted-foreground truncate"
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot} animate-pulse`} />
          <span className="truncate">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Main Component ── */

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      step: "01", title: t('landing.step01Title'), description: t('landing.step01Desc'),
      icon: <DatabaseIcon className="w-5 h-5" />, color: "text-blue-400",
      borderColor: "border-blue-500/20", bgGlow: "bg-blue-500/10",
      visual: <DataStreamViz />,
    },
    {
      step: "02", title: t('landing.step02Title'), description: t('landing.step02Desc'),
      icon: <BrainIcon className="w-5 h-5" />, color: "text-purple-400",
      borderColor: "border-purple-500/20", bgGlow: "bg-purple-500/10",
      visual: <NeuralNetViz />,
    },
    {
      step: "03", title: t('landing.step03Title'), description: t('landing.step03Desc'),
      icon: <MapIcon className="w-5 h-5" />, color: "text-emerald-400",
      borderColor: "border-emerald-500/20", bgGlow: "bg-emerald-500/10",
      visual: <SimulationViz />,
    },
    {
      step: "04", title: t('landing.step04Title'), description: t('landing.step04Desc'),
      icon: <ZapIcon className="w-5 h-5" />, color: "text-amber-400",
      borderColor: "border-amber-500/20", bgGlow: "bg-amber-500/10",
      visual: <DeployViz />,
    },
  ];

  return (
    <section id="how-it-works" className="relative py-32">
      <div className="container max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold font-heading mb-6 text-foreground"
          >
            {t('landing.howIt')}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              {t('landing.works')}
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {t('landing.howItWorksSubtitle')}
          </motion.p>
        </div>

        {/* ── Desktop: Horizontal Stepper ── */}
        <div className="hidden md:block relative">
          {/* Connecting line */}
          <div className="absolute top-[28px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-[2px] bg-border/40">
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 via-emerald-500 to-amber-500"
            />
          </div>

          <div className="grid grid-cols-4 gap-5">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="flex flex-col items-center"
              >
                {/* Step Circle */}
                <div className={`relative z-10 w-14 h-14 rounded-full ${step.bgGlow} border-2 ${step.borderColor} flex items-center justify-center backdrop-blur-md shadow-lg mb-5 bg-background`}>
                  <span className={step.color}>{step.icon}</span>
                </div>

                {/* Card — fixed height, overflow hidden */}
                <div className={`rounded-2xl border ${step.borderColor} bg-card/60 backdrop-blur-md p-5 hover:bg-card/80 transition-all hover:shadow-xl w-full h-[340px] flex flex-col overflow-hidden`}>
                  <div className={`text-xs font-bold ${step.color} uppercase tracking-[0.2em] mb-2 shrink-0`}>
                    {t('landing.step')} {step.step}
                  </div>
                  <h3 className="text-base font-bold font-heading text-foreground mb-2 leading-snug shrink-0">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-[13px] leading-relaxed line-clamp-3 shrink-0 mb-auto">
                    {step.description}
                  </p>
                  <div className="mt-3 shrink-0">
                    {step.visual}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Mobile: Vertical stack ── */}
        <div className="md:hidden space-y-5">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className={`rounded-2xl border ${step.borderColor} bg-card/60 backdrop-blur-md p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${step.bgGlow} border ${step.borderColor} flex items-center justify-center shrink-0`}>
                    <span className={step.color}>{step.icon}</span>
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${step.color} uppercase tracking-[0.2em]`}>
                      {t('landing.step')} {step.step}
                    </div>
                    <h3 className="text-base font-bold font-heading text-foreground">{step.title}</h3>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{step.description}</p>
                {step.visual}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
