import React from 'react';
import {
  Waves,
  Watch,
  LineChart,
  CloudCheck,
  Download,
  Sun,
  Moon,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => Promise<void>;
  loggingIn: boolean;
  darkMode: boolean;
  onToggleTheme: () => void;
  errorMessage?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  loggingIn,
  darkMode,
  onToggleTheme,
  errorMessage,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Bar with Theme Toggle */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Waves className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
            Aqua<span className="text-cyan-600 dark:text-cyan-400">Track</span>
          </span>
        </div>

        <button
          onClick={onToggleTheme}
          type="button"
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
          title={darkMode ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
          aria-label="Przełącz motyw interfejsu"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </header>

      {/* Main Hero & Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-cyan-950/5 dark:shadow-none text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/80 mb-6">
            <Watch className="w-3.5 h-3.5" />
            <span>Apple Watch & Firebase Cloud</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Twój osobisty dzienniczek pływania
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 max-w-md mx-auto">
            Wklepuj dane treningowe z zegarka Apple Watch, śledź tempo /100m, analizuj postępy na wykresach i synchronizuj treningi w chmurze.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-8 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                <Watch className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Apple Watch & Długości
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Długości basenu (25m/50m), czas, tempo /100m, tętno i spalone kalorie.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                <LineChart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Wykresy & Statystyki
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Wizualizacja tempa, objętości tygodniowej oraz rekordu życiowego.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CloudCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Synchronizacja w chmurze
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Dane w Firebase dostępne w czasie rzeczywistym na każdym Twoim urządzeniu.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Eksport do CSV
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Jednym kliknięciem pobierz historię treningów do programu Excel lub Numbers.
                </p>
              </div>
            </div>
          </div>

          {/* Error Banner if any */}
          {errorMessage && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={onLogin}
            disabled={loggingIn}
            type="button"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-teal-600 hover:from-cyan-500 hover:via-sky-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-cyan-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
          >
            {loggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Logowanie do Firebase...</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-1 shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <span>Zaloguj się przez konto Google</span>
              </>
            )}
          </button>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bezpieczne logowanie OAuth · Twoje treningi są chronione regułami Firestore</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        AquaTrack · Dzienniczek Pływania z Apple Watch & Firebase
      </footer>
    </div>
  );
};
