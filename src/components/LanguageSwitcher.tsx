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

function ThailandFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 6 6" className={className} aria-hidden="true">
      <clipPath id="th-clip"><circle cx="3" cy="3" r="3"/></clipPath>
      <g clipPath="url(#th-clip)">
        <rect width="6" height="1" y="0" fill="#ED2E38"/>
        <rect width="6" height="1" y="1" fill="#FFFFFF"/>
        <rect width="6" height="2" y="2" fill="#2D2A4A"/>
        <rect width="6" height="1" y="4" fill="#FFFFFF"/>
        <rect width="6" height="1" y="5" fill="#ED2E38"/>
      </g>
    </svg>
  );
}

function IndonesiaFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 6 6" className={className} aria-hidden="true">
      <clipPath id="id-clip"><circle cx="3" cy="3" r="3"/></clipPath>
      <g clipPath="url(#id-clip)">
        <rect width="6" height="3" y="0" fill="#E22026"/>
        <rect width="6" height="3" y="3" fill="#FFFFFF"/>
      </g>
    </svg>
  );
}

function MalaysiaFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" className={className} aria-hidden="true">
      <clipPath id="ms-clip"><circle cx="7" cy="7" r="7"/></clipPath>
      <g clipPath="url(#ms-clip)">
        <rect width="14" height="1" y="0" fill="#CC0000"/>
        <rect width="14" height="1" y="1" fill="#FFFFFF"/>
        <rect width="14" height="1" y="2" fill="#CC0000"/>
        <rect width="14" height="1" y="3" fill="#FFFFFF"/>
        <rect width="14" height="1" y="4" fill="#CC0000"/>
        <rect width="14" height="1" y="5" fill="#FFFFFF"/>
        <rect width="14" height="1" y="6" fill="#CC0000"/>
        <rect width="14" height="1" y="7" fill="#FFFFFF"/>
        <rect width="14" height="1" y="8" fill="#CC0000"/>
        <rect width="14" height="1" y="9" fill="#FFFFFF"/>
        <rect width="14" height="1" y="10" fill="#CC0000"/>
        <rect width="14" height="1" y="11" fill="#FFFFFF"/>
        <rect width="14" height="1" y="12" fill="#CC0000"/>
        <rect width="14" height="1" y="13" fill="#FFFFFF"/>
        <rect width="8" height="8" x="0" y="0" fill="#002060"/>
        <path d="M 3.5 2 A 2 2 0 1 0 5 5.5 A 2.2 2.2 0 1 1 3.5 2 Z" fill="#FFCC00"/>
        <polygon points="5.5,2.5 5.8,3.2 6.5,3.2 6,3.6 6.2,4.3 5.5,3.9 4.8,4.3 5,3.6 4.5,3.2 5.2,3.2" fill="#FFCC00"/>
      </g>
    </svg>
  );
}

function PhilippinesFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 30" className={className} aria-hidden="true">
      <clipPath id="tl-clip"><circle cx="15" cy="15" r="15"/></clipPath>
      <g clipPath="url(#tl-clip)">
        <rect width="30" height="15" y="0" fill="#0038A8"/>
        <rect width="30" height="15" y="15" fill="#CE1126"/>
        <polygon points="0,0 15,15 0,30" fill="#FFFFFF"/>
        <circle cx="5" cy="15" r="2.5" fill="#FCD116"/>
        <polygon points="2,4 2.3,4.7 3,4.7 2.5,5.1 2.7,5.8 2,5.4 1.3,5.8 1.5,5.1 1,4.7 1.7,4.7" fill="#FCD116"/>
        <polygon points="2,26 2.3,26.7 3,26.7 2.5,27.1 2.7,27.8 2,27.4 1.3,27.8 1.5,27.1 1,26.7 1.7,26.7" fill="#FCD116"/>
        <polygon points="12,15 12.3,15.7 13,15.7 12.5,16.1 12.7,16.8 12,16.4 11.3,16.8 11.5,16.1 11,15.7 11.7,15.7" fill="#FCD116"/>
      </g>
    </svg>
  );
}

function CambodiaFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <clipPath id="km-clip"><circle cx="8" cy="8" r="8"/></clipPath>
      <g clipPath="url(#km-clip)">
        <rect width="16" height="4" y="0" fill="#032EA1"/>
        <rect width="16" height="8" y="4" fill="#E21C1C"/>
        <rect width="16" height="4" y="12" fill="#032EA1"/>
        <path d="M 5 10 L 11 10 L 11 9 L 10.2 9 L 10.2 7.5 L 9.5 7.5 L 9.5 9 L 8.5 9 L 8.5 6.5 L 7.5 6.5 L 7.5 9 L 6.5 9 L 6.5 7.5 L 5.8 7.5 L 5.8 9 L 5 9 Z" fill="#FFFFFF"/>
      </g>
    </svg>
  );
}

function LaosFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 8" className={className} aria-hidden="true">
      <clipPath id="lo-clip"><circle cx="4" cy="4" r="4"/></clipPath>
      <g clipPath="url(#lo-clip)">
        <rect width="8" height="2" y="0" fill="#CE1126"/>
        <rect width="8" height="4" y="2" fill="#002868"/>
        <rect width="8" height="2" y="6" fill="#CE1126"/>
        <circle cx="4" cy="4" r="1.2" fill="#FFFFFF"/>
      </g>
    </svg>
  );
}

function MyanmarFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 30" className={className} aria-hidden="true">
      <clipPath id="my-clip"><circle cx="15" cy="15" r="15"/></clipPath>
      <g clipPath="url(#my-clip)">
        <rect width="30" height="10" y="0" fill="#FECB00"/>
        <rect width="30" height="10" y="10" fill="#34B233"/>
        <rect width="30" height="10" y="20" fill="#EA2839"/>
        <polygon points="15,6 17.5,13.5 25,13.5 19,18 21.5,25.5 15,21 8.5,25.5 11,18 5,13.5 12.5,13.5" fill="#FFFFFF"/>
      </g>
    </svg>
  );
}

const LANGUAGES: { locale: Locale; label: string; Flag: typeof VietnamFlag }[] = [
  { locale: 'vi', label: 'Tiếng Việt', Flag: VietnamFlag },
  { locale: 'en', label: 'English', Flag: UKFlag },
  { locale: 'th', label: 'ไทย (Thai)', Flag: ThailandFlag },
  { locale: 'id', label: 'Indonesia', Flag: IndonesiaFlag },
  { locale: 'ms', label: 'Melayu', Flag: MalaysiaFlag },
  { locale: 'tl', label: 'Filipino', Flag: PhilippinesFlag },
  { locale: 'km', label: 'Khmer', Flag: CambodiaFlag },
  { locale: 'lo', label: 'Lào (Lao)', Flag: LaosFlag },
  { locale: 'my', label: 'Burmese', Flag: MyanmarFlag },
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
