"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { TrendingUp, MapPin, Clock, Zap } from "lucide-react";

function AnimatedNumber({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString()),
    });
    return () => controls.stop();
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export default function ImpactStats() {
  const { t } = useTranslation();

  const stats = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      value: parseInt(t("landing.stat1Value")),
      suffix: t("landing.stat1Suffix"),
      label: t("landing.stat1Label"),
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      value: parseInt(t("landing.stat2Value")),
      suffix: t("landing.stat2Suffix"),
      label: t("landing.stat2Label"),
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: parseInt(t("landing.stat3Value")),
      suffix: " " + t("landing.stat3Suffix"),
      label: t("landing.stat3Label"),
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      value: parseInt(t("landing.stat4Value")),
      suffix: t("landing.stat4Suffix"),
      prefix: "<",
      label: t("landing.stat4Label"),
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold font-heading mb-6 text-foreground"
          >
            {t("landing.impactTitle")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              {t("landing.impactHighlight")}
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {t("landing.impactSubtitle")}
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`relative p-8 rounded-2xl border ${stat.borderColor} bg-card/50 backdrop-blur-md text-center hover:shadow-xl transition-all group`}
            >
              {/* Icon */}
              <div className={`mx-auto mb-5 w-14 h-14 rounded-2xl ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>

              {/* Number */}
              <div className={`text-4xl md:text-5xl font-black font-heading ${stat.color} mb-2`}>
                {"prefix" in stat && stat.prefix}
                <AnimatedNumber value={stat.value} suffix={stat.suffix} duration={1.5 + idx * 0.3} />
              </div>

              {/* Label */}
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
