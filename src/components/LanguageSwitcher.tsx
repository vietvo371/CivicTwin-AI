'use client';

import { useTranslation, Locale } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

/* ── Circular SVG Flags ── */
function VietnamFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <clipPath id="vn-clip"><circle cx="16" cy="16" r="16"/></clipPath>
      <g clipPath="url(#vn-clip)">
        <rect width="32" height="32" fill="#DA251D"/>
        <polygon points="16,6 18.47,12.76 25.6,12.76 19.56,17.24 22.04,24 16,19.53 9.96,24 12.44,17.24 6.4,12.76 13.53,12.76" fill="#FFFF00"/>
      </g>
    </svg>
  );
}

function UKFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <clipPath id="uk-clip"><circle cx="16" cy="16" r="16"/></clipPath>
      <g clipPath="url(#uk-clip)">
        <rect width="32" height="32" fill="#012169"/>
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#fff" strokeWidth="5.5"/>
        <path d="M0,0 L32,32 M32,0 L0,32" stroke="#C8102E" strokeWidth="3.5" clipPath="url(#uk-diag)"/>
        <clipPath id="uk-diag">
          <path d="M16,0 L32,0 L32,16 Z M0,16 L0,32 L16,32 Z"/>
        </clipPath>
        <path d="M0,0 L32,32" stroke="#C8102E" strokeWidth="2" transform="translate(0.5,0)"/>
        <path d="M32,0 L0,32" stroke="#C8102E" strokeWidth="2" transform="translate(-0.5,0)"/>
        <path d="M16,0 V32 M0,16 H32" stroke="#fff" strokeWidth="7"/>
        <path d="M16,0 V32 M0,16 H32" stroke="#C8102E" strokeWidth="4"/>
      </g>
    </svg>
  );
}

const LANGUAGES: { locale: Locale; label: string; Flag: typeof VietnamFlag }[] = [
  { locale: 'vi', label: 'Tiếng Việt', Flag: VietnamFlag },
  { locale: 'en', label: 'English', Flag: UKFlag },
];

export function LanguageSwitcher({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
  const { locale, setLocale } = useTranslation();
  const current = LANGUAGES.find(l => l.locale === locale)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          variant === 'full'
            ? 'flex items-center gap-2.5 px-3 py-2 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 hover:border-border transition-all duration-200 text-sm font-medium text-foreground group outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer'
            : 'relative flex items-center justify-center w-9 h-9 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 hover:border-border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 group cursor-pointer'
        }
      >
        <current.Flag className="w-5 h-5 rounded-full shadow-sm ring-1 ring-black/10" />
        {variant === 'full' && (
          <>
            <span className="hidden sm:inline">{current.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-xl shadow-xl border-border/80 bg-popover/95 backdrop-blur-xl">
        {LANGUAGES.map(({ locale: loc, label, Flag }) => {
          const isActive = loc === locale;
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => setLocale(loc)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Flag className="w-5 h-5 rounded-full shadow-sm ring-1 ring-black/10 shrink-0" />
              <span className="flex-1 text-sm">{label}</span>
              {isActive && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
