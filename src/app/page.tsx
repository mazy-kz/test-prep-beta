export const metadata = { title: 'Tolendi Test Prep — Beta v1.1' };

export default function Home() {
  return (
    <main
      className="
        min-h-screen
        bg-center bg-cover
        bg-[url('/landing.jpg')]
        relative
      "
    >
      {/* overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-3xl md:text-5xl font-semibold text-white drop-shadow-sm">
          Tolendi Test Prep — Beta v1.1
        </h1>

        <p className="mt-4 text-white/90 text-lg md:text-xl">Good Luck.</p>

        <div className="mt-8 flex gap-3">
          <a
            href="/student"
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Student
          </a>
          <a
            href="/login"
            className="px-5 py-2 rounded-xl bg-white/90 text-gray-900 hover:bg-white transition"
          >
            Admin
          </a>
        </div>
      </div>
    </main>
  );
}