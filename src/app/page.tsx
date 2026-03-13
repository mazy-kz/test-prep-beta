import type { Metadata } from 'next';
import { buttonClasses } from '@/components/ui/button';
import { PRODUCT_TITLE, PRODUCT_VERSION } from '@/lib/branding';

export const metadata: Metadata = { title: PRODUCT_TITLE };

export default function Home() {
  return (
    <main
      className="
        min-h-screen
        bg-center bg-cover
        bg-[url('/landing.JPG')]
        relative
      "
    >
      {/* overlay for readability */}
      <div className="absolute inset-0 bg-slate-950/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/20 to-slate-950/70" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <span className="text-xs uppercase tracking-[0.35em] text-slate-100/80">
          {PRODUCT_VERSION}
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-white drop-shadow md:text-4xl">
          {PRODUCT_TITLE}
        </h1>

        <p className="mt-4 max-w-xl text-sm text-slate-100 md:text-base">
          Sharpen your skills with focused practice sets and instant feedback.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="/student" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
            Student
          </a>
          <a
            href="/login"
            className={buttonClasses({
              variant: 'secondary',
              size: 'lg',
              className: 'border-white/60 bg-white/95 text-slate-900 backdrop-blur hover:bg-white',
            })}
          >
            Admin
          </a>
        </div>
      </div>
    </main>
  );
}
