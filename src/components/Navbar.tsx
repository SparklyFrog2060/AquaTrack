import React from 'react';
import {
  Waves,
  Sun,
  Moon,
  Download,
  Plus,
  CloudCheck,
  RefreshCw,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import type { User } from '../firebase';

interface NavbarProps {
  user: User;
  syncStatus: 'synced' | 'syncing' | 'offline';
  darkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onOpenNewSession: () => void;
  onExportCsv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  syncStatus,
  darkMode,
  onToggleTheme,
  onLogout,
  onOpenNewSession,
  onExportCsv,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Waves className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                Aqua<span className="text-cyan-600 dark:text-cyan-400">Track</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Pływanie & Watch
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block -mt-0.5">
              Dzienniczek treningów i synchronizacja w chmurze
            </p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden md:flex items-center">
          {syncStatus === 'synced' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              title="Wszystkie treningi są zsynchronizowane w chmurze Firebase"
            >
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Chmura Firebase: zsynchronizowano</span>
            </div>
          )}
          {syncStatus === 'syncing' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-spin" />
              <span>Synchronizowanie...</span>
            </div>
          )}
          {syncStatus === 'offline' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              title="Brak połączenia z chmurą Firebase"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Tryb offline</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            type="button"
            className="p-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            title="Eksportuj do CSV (Excel)"
            aria-label="Eksportuj do CSV"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Eksportuj CSV</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            type="button"
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={darkMode ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
            aria-label="Przełącz motyw interfejsu"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Add Workout Button */}
          <button
            onClick={onOpenNewSession}
            type="button"
            className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 rounded-lg shadow-sm shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            aria-label="Dodaj nowy trening"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">Wpisz trening</span>
            <span className="xs:hidden sm:hidden">Trening</span>
          </button>

          {/* User profile & Logout */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
            <div
              className="flex items-center gap-1.5 group relative"
              title={`Zalogowano jako: ${user.displayName || user.email}`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Użytkownik'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-cyan-500/30 object-cover"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="hidden xl:inline text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                {user.displayName?.split(' ')[0] || user.email}
              </span>
            </div>
            <button
              onClick={onLogout}
              type="button"
              className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
              title="Wyloguj się z konta Google"
              aria-label="Wyloguj się"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
