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
      {/* subtle dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-xl md:text-2xl font-semibold text-white drop-shadow-sm">
          Tolendi Test Prep — Beta v1.1
        </h1>

        <h1 className="text-xl md:text-2xl font-semibold text-yellow-500 drop-shadow-sm">
          Good Luck!
        </h1>
        <div className="mt-8 flex gap-3">
          <a
            href="/student"
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-white transition"
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