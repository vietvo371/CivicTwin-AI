'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const errorMsg = searchParams.get('error');

      if (errorMsg) {
        setError(errorMsg);
        setTimeout(() => {
          router.push('/');
        }, 3000);
        return;
      }

      if (token) {
        localStorage.setItem('token', token);
        
        try {
          const res = await api.get('/auth/me');
          const roles: string[] = res.data?.data?.user?.roles || [];
          
          if (roles.includes('super_admin') || roles.includes('city_admin')) {
            window.location.href = '/admin';
          } else if (roles.includes('traffic_operator')) {
            window.location.href = '/dashboard';
          } else if (roles.includes('emergency')) {
            window.location.href = '/emergency';
          } else {
            window.location.href = '/map';
          }
        } catch {
          window.location.href = '/map';
        }
      } else {
        setError(t('authCallback.noToken'));
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    };

    handleAuth();
  }, [router, searchParams, t]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-white p-4">
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl max-w-md text-center">
          <h2 className="text-xl font-bold text-rose-400 mb-2">{t('authCallback.loginFailed')}</h2>
          <p className="text-slate-300">{error}</p>
          <p className="text-sm text-slate-500 mt-4">{t('authCallback.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-white">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
        {t('authCallback.authenticating')}
      </h2>
      <p className="text-slate-400 text-sm mt-2">{t('authCallback.pleaseWait')}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
