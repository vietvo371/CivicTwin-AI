"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LoginDialog() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { t } = useTranslation();
  
  // States
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login States
  const [email, setEmail] = useState('admin@civictwin.local');
  const [password, setPassword] = useState('password');

  // Register States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const getRedirectByRoles = (roles: string[]) => {
    if (roles.includes('super_admin') || roles.includes('city_admin')) return '/admin';
    if (roles.includes('traffic_operator')) return '/dashboard';
    if (roles.includes('emergency')) return '/emergency';
    return '/map';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      const res = await api.get('/auth/me');
      const roles: string[] = res.data?.data?.user?.roles || [];
      setOpen(false);
      router.push(getRedirectByRoles(roles));
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (regPassword !== regConfirmPassword) {
      setError(t('auth.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      await register(regName, regEmail, regPassword, regConfirmPassword);
      setOpen(false);
      router.push('/map');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-primary hover:bg-primary/90 text-primary-foreground border border-border px-6 backdrop-blur-md rounded-full font-semibold transition-all shadow-md h-10 flex items-center justify-center text-sm">
        {t('loginDialog.consoleSignIn')}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-2xl border-border text-foreground shadow-2xl rounded-2xl p-0 overflow-hidden">
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

        <DialogHeader className="flex flex-col items-center justify-center gap-3 space-y-0 px-6 pt-8 pb-3 border-b border-border bg-secondary/20">
          <div className="flex items-center justify-center relative shrink-0 group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
            <Image 
              src="/logo.png" 
              alt="CivicTwin AI Logo" 
              width={64} 
              height={64} 
              className="object-contain w-16 h-16 relative z-10 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-transform duration-300 group-hover:scale-105" 
              unoptimized 
            />
          </div>
          <div className="flex flex-col text-center">
            <DialogTitle className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              CivicTwin AI
            </DialogTitle>
            <DialogDescription className="text-sm font-medium mt-1 text-muted-foreground">
              {t('loginDialog.commandCenter')}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-6 pt-4 pb-2">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
              {error}
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary border border-border rounded-xl p-1 mb-4">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground shadow-sm">{t('loginDialog.signIn')}</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground shadow-sm">{t('loginDialog.signUp')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0 outline-none">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-sm font-semibold text-muted-foreground">{t('loginDialog.emailAddress')}</label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background border-input text-foreground h-11 focus-visible:ring-blue-500/50 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="text-sm font-semibold text-muted-foreground">{t('loginDialog.password')}</label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background border-input text-foreground h-11 focus-visible:ring-blue-500/50 transition-all font-medium"
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full text-base font-bold h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all transform hover:scale-[1.02]" 
                    disabled={loading}
                  >
                    {loading ? t('loginDialog.authenticating') : t('loginDialog.signIn')}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0 outline-none">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reg-name" className="text-sm font-semibold text-muted-foreground">{t('loginDialog.fullName')}</label>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="John Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className="bg-background border-input text-foreground h-11 focus-visible:ring-blue-500/50 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="text-sm font-semibold text-muted-foreground">{t('loginDialog.emailAddress')}</label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="citizen@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="bg-background border-input text-foreground h-11 focus-visible:ring-blue-500/50 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="reg-password" className="text-sm font-semibold text-muted-foreground">{t('loginDialog.password')}</label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className="bg-background border-input text-foreground h-11 focus-visible:ring-blue-500/50 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="reg-confirm" className="text-sm font-semibold text-muted-foreground">{t('loginDialog.confirm')}</label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      className="bg-background border-input text-foreground h-11 focus-visible:ring-blue-500/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full text-base font-bold h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all transform hover:scale-[1.02]" 
                    disabled={loading}
                  >
                    {loading ? t('loginDialog.registering') : t('loginDialog.createAccount')}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {/* Social Login Separator */}
          <div className="mt-6 mb-4 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-border"></div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{t('loginDialog.orContinueWith')}</span>
            <div className="h-[1px] flex-1 bg-border"></div>
          </div>

          {/* Google Login Button */}
          <Button 
            type="button" 
            variant="outline"
            className="w-full text-base font-medium h-12 bg-secondary hover:bg-secondary/80 text-foreground border-border flex items-center justify-center gap-3 transition-colors"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/redirect`;
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Google
          </Button>
        </div>

        <div className="flex justify-center py-4 border-t border-border bg-secondary/30">
          <p className="text-xs font-medium text-muted-foreground">
            {t('loginDialog.citizenOperatorAuth')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
