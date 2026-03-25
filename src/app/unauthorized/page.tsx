'use client';

import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

export default function UnauthorizedPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 flex-col gap-6 text-center">
      <div className="p-6 rounded-3xl bg-card/50 border border-border/50 flex flex-col items-center max-w-md w-full shadow-2xl backdrop-blur-xl">
        <div className="w-20 h-20 bg-destructive/5 rounded-full flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20 text-destructive">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">{t('auth.accessDenied')}</h1>
        <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
          {t('auth.accessDeniedDesc')}
        </p>

        <div className="w-full space-y-3">
          <Link href="/" className="w-full inline-block">
            <Button className="w-full" size="lg">{t('auth.returnHome')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
