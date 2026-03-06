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
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <span className="text-xs uppercase tracking-[0.35em] text-slate-100/80">
          {PRODUCT_VERSION}
        </span>
        <h1 className="mt-3 text-xl md:text-3xl font-semibold text-white drop-shadow-sm">
          {PRODUCT_TITLE}
        </h1>

        <p className="mt-4 text-sm md:text-base text-slate-100/90 max-w-xl">
          Sharpen your skills with focused practice sets and instant feedback.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a href="/student" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
            Student
          </a>
          <a
            href="/login"
            className={buttonClasses({
              variant: 'secondary',
              size: 'lg',
              className: 'bg-white/90 backdrop-blur hover:bg-white',
            })}
          >
            Admin
          </a>
        </div>
      </div>
    </main>
  );
}
