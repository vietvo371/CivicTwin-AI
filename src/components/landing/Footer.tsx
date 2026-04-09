"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Github, Linkedin, Mail, ExternalLink, Trophy } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const links = {
    product: [
      { label: t('landing.liveMap'), href: '/map' },
      { label: t('landing.dashboard'), href: '/dashboard' },
      { label: t('landing.predictions'), href: '/dashboard/predictions' },
      { label: t('landing.incidents'), href: '/dashboard/incidents' },
    ],
    company: [
      { label: 'TechGuard ASEAN', href: '#' },
      { label: 'DTU Team 1', href: '#' },
      { label: t('landing.systemStatus'), href: '#' },
    ],
    legal: [
      { label: t('landing.privacyPolicy'), href: '#' },
      { label: t('landing.termsOfService'), href: '#' },
    ],
  };

  const socials = [
    { icon: <Github className="w-4 h-4" />, href: 'https://github.com', label: 'GitHub' },
    { icon: <Linkedin className="w-4 h-4" />, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: <Mail className="w-4 h-4" />, href: 'mailto:contact@civictwin.ai', label: 'Email' },
  ];

  return (
    <footer className="relative z-10 mt-20 border-t border-border/50 bg-gradient-to-b from-background via-background to-background/80">
      {/* Gradient top border */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      {/* Subtle grid bg */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
        {/* Hackathon Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Trophy className="w-3.5 h-3.5" />
            {t('landing.hackathonBadge')}
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/logo.png" alt="CivicTwin AI" width={40} height={40} className="object-contain" unoptimized />
              <span className="text-xl font-bold font-heading text-foreground">
                CivicTwin<span className="text-blue-500">AI</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t('landing.footerTagline')}
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-muted-foreground hover:text-foreground transition-all hover:shadow-lg hover:shadow-blue-500/5"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              {t('landing.product')}
            </h4>
            <ul className="space-y-2.5">
              {links.product.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group">
                    {link.label}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              {t('landing.company')}
            </h4>
            <ul className="space-y-2.5">
              {links.company.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              {t('landing.legal')}
            </h4>
            <ul className="space-y-2.5">
              {links.legal.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {year} Team DTU 1 — TechGuard ASEAN. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('landing.allSystemsOperational')}
          </div>
        </div>
      </div>
    </footer>
  );
}
