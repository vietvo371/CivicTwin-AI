"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export default function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 via-indigo-600/8 to-purple-600/8" />
      <div className="absolute inset-0 border-y border-border/50" />

      {/* Decorative blurred circles */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative z-10 container max-w-3xl mx-auto px-6 text-center">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold font-heading mb-6 text-foreground"
        >
          {t("landing.ctaTitle")}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed"
        >
          {t("landing.ctaSubtitle")}
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/map">
            <Button
              size="lg"
              className="h-14 px-10 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none hover:opacity-90 transition-all rounded-full shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              {t("landing.ctaDemo")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <button
            onClick={() => {
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="h-14 px-10 rounded-full bg-secondary/50 hover:bg-secondary border border-border font-bold transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer text-base"
          >
            <Play className="w-4 h-4" />
            {t("landing.ctaVideo")}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
