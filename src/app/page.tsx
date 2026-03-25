'use client';

import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n';
import HeroSection from '@/components/landing/HeroSection';
import Navbar from '@/components/landing/Navbar';

// Lazy load below-fold components for faster initial page load
const InfiniteMarquee = dynamic(() => import('@/components/landing/InfiniteMarquee'), {
  loading: () => <div className="h-20" />,
});
const BentoGrid = dynamic(() => import('@/components/landing/BentoGrid'), {
  loading: () => <div className="h-96" />,
});
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks'), {
  loading: () => <div className="h-96" />,
});
const Footer = dynamic(() => import('@/components/landing/Footer'), {
  loading: () => <div className="h-40" />,
});

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip font-sans selection:bg-blue-500/30">
      
      {/* Modern Navbar */}
      <Navbar showScrollProgress />

      {/* Landing Page Content Sections */}
      <HeroSection />
      
      <InfiniteMarquee />
      
      <BentoGrid />
      
      <HowItWorks />

      {/* Professional Footer */}
      <Footer />
    </div>
  );
}
