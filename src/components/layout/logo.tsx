import Link from 'next/link';

export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect width="32" height="32" className="fill-foreground" />
    <rect x="18" y="18" width="8" height="8" className="fill-accent" />
  </svg>
);

export const Logo = () => (
  <Link href="/" className="flex items-center gap-2.5" aria-label="SkinScout, на главную">
    <LogoMark className="size-8" />
    <span className="font-display text-sm font-semibold tracking-tight uppercase">SkinScout</span>
  </Link>
);
