import Link from 'next/link';

export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect width="32" height="32" rx="10" className="fill-foreground" />
    <circle cx="12.5" cy="16" r="6" className="fill-market-wm" />
    <circle cx="19.5" cy="16" r="6" className="fill-market-dm" fillOpacity="0.9" />
  </svg>
);

export const Logo = () => (
  <Link href="/" className="flex items-center gap-2.5" aria-label="SkinScout, на главную">
    <LogoMark className="size-8" />
    <span className="text-[1.0625rem] font-bold tracking-tight">SkinScout</span>
  </Link>
);
