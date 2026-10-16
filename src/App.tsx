import React, { useState, useEffect, useMemo } from 'react';
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  logoutUser,
  subscribeToUserSessions,
  saveSwimSession,
  deleteSwimSession,
  testConnection,
  type User,
} from './firebase';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { WeeklyStatsCard } from './components/WeeklyStatsCard';
import { ProgressCharts } from './components/ProgressCharts';
import { SessionList } from './components/SessionList';
import { SessionFormModal } from './components/SessionFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { type SwimSession } from './types';
import {
  aggregateWeeklyStats,
  exportToCsv,
  toISODateString,
  formatDuration,
} from './utils/swimCalculations';
import {
  Watch,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Waves,
} from 'lucide-react';

const THEME_STORAGE_KEY = 'aquatrack_theme';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sessions state (strictly from Firebase Firestore for the authenticated user)
  const [sessions, setSessions] = useState<SwimSession[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<SwimSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<SwimSession | null>(null);

  // Week navigation offset (0 = current week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Apple Watch Help collapsed
  const [showWatchGuide, setShowWatchGuide] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Show notification toast
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Sync theme with HTML class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [darkMode]);

  // Clean any old local demo data from earlier versions
  useEffect(() => {
    localStorage.removeItem('aquatrack_local_sessions');
  }, []);

  // Initial connection test
  useEffect(() => {
    testConnection().then((connected) => {
      if (!connected) {
        console.warn('Firebase initialized in offline or standby state');
      }
    });
  }, []);

  // Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setSyncStatus('syncing');
        // Subscribe to user's real-time sessions strictly from Firestore
        const unsubSessions = subscribeToUserSessions(
          currentUser.uid,
          (liveSessions) => {
            setSessions(liveSessions);
            setSyncStatus('synced');
          },
          (err) => {
            console.error('Session sync error:', err);
            setSyncStatus('offline');
          }
        );

        return () => unsubSessions();
      } else {
        // Not logged in: reset sessions
        setSessions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Google Login action
  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      setAuthError(null);
      const loggedUser = await loginWithGoogle();
      showToast(`Zalogowano jako ${loggedUser.displayName || loggedUser.email}!`, 'success');
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Logowanie przez konto Google nie powiodło się.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Logout action
  const handleLogout = async () => {
    try {
      await logoutUser();
      setSessions([]);
      showToast('Wylogowano z konta Google.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Save session to Firebase Firestore
  const handleSaveSession = async (session: SwimSession) => {
    if (!user) {
      showToast('Musisz być zalogowany, aby zapisać trening.', 'error');
      return;
    }
    setSyncStatus('syncing');
    await saveSwimSession(user.uid, session);
    setSyncStatus('synced');
    showToast('Trening został pomyślnie zapisany w chmurze Firebase!', 'success');
  };

  // Delete session from Firebase Firestore
  const handleDeleteSession = async () => {
    if (!deletingSession || !user || !deletingSession.id) return;
    setSyncStatus('syncing');
    await deleteSwimSession(user.uid, deletingSession.id);
    setSyncStatus('synced');
    showToast('Trening został usunięty z bazy danych.', 'info');
    setDeletingSession(null);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (sessions.length === 0) {
      showToast('Brak treningów do wyeksportowania. Wpisz najpierw swój trening.', 'info');
      return;
    }
    const csvContent = exportToCsv(sessions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dzienniczek_plywania_${toISODateString(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Wyeksportowano plik CSV gotowy do Excela!', 'success');
  };

  // Compute reference date for weekly stats based on weekOffset
  const referenceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weeklyStats = useMemo(() => {
    return aggregateWeeklyStats(sessions, referenceDate);
  }, [sessions, referenceDate]);

  // Loading screen during initial auth resolution
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-500 text-white flex items-center justify-center shadow-xl shadow-cyan-500/25 animate-pulse mb-4">
          <Waves className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Uruchamianie AquaTrack...
        </p>
      </div>
    );
  }

  // If user is not logged in, render mandatory Google login screen
  if (!user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        loggingIn={loggingIn}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        errorMessage={authError}
      />
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 backdrop-blur-md ${
            notification.type === 'success'
              ? 'bg-emerald-900/90 text-white border-emerald-500'
              : notification.type === 'error'
              ? 'bg-rose-900/90 text-white border-rose-500'
              : 'bg-slate-900/90 text-white border-cyan-500'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Navigation */}
      <Navbar
        user={user}
        syncStatus={syncStatus}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        onLogout={handleLogout}
        onOpenNewSession={() => {
          setEditingSession(null);
          setIsModalOpen(true);
        }}
        onExportCsv={handleExportCsv}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Collapsible Apple Watch input guide card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <button
            onClick={() => setShowWatchGuide(!showWatchGuide)}
            type="button"
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Watch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Jak wklepywać dane z treningu pływackiego na Apple Watch?
              </span>
            </div>
            {showWatchGuide ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {showWatchGuide && (
            <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p>
                W aplikacji <strong className="text-slate-800 dark:text-slate-200">Kondycja</strong> na iPhonie lub podsumowaniu na zegarku Apple Watch znajdziesz kluczowe parametry:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="block text-slate-400 font-sans">1. Długości basenu</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">np. 40 basenów (1000m)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="block text-slate-400 font-sans">2. Czas trwania</span>
                  <span className="font-bold text-slate-900 dark:text-white">np. 24:30 lub 32:15</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="block text-slate-400 font-sans">3. Średnie tempo</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">np. 1:52 /100m</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="block text-slate-400 font-sans">4. Tętno & Kalorie</span>
                  <span className="font-bold text-amber-500">142 bpm · 380 kcal</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Weekly Statistics KPI Section */}
        <WeeklyStatsCard
          stats={weeklyStats}
          currentWeekOffset={weekOffset}
          onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
          onNextWeek={() => setWeekOffset((prev) => prev + 1)}
          onCurrentWeek={() => setWeekOffset(0)}
        />

        {/* Progress Charts Section */}
        <ProgressCharts sessions={sessions} />

        {/* Workouts History List */}
        <SessionList
          sessions={sessions}
          onEdit={(session) => {
            setEditingSession(session);
            setIsModalOpen(true);
          }}
          onDelete={(session) => {
            setDeletingSession(session);
          }}
          onAddNew={() => {
            setEditingSession(null);
            setIsModalOpen(true);
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AquaTrack · Dzienniczek Pływania z Apple Watch & Firebase</span>
          <span className="text-[11px] opacity-75">
            Synchronizacja danych w czasie rzeczywistym · Bezpieczne reguły Firestore
          </span>
        </div>
      </footer>

      {/* Form Modal for Creating / Editing */}
      <SessionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSession(null);
        }}
        onSave={handleSaveSession}
        editingSession={editingSession}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deletingSession !== null}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleDeleteSession}
        sessionDescription={
          deletingSession
            ? `${deletingSession.date} (${deletingSession.distance}m · ${formatDuration(
                deletingSession.durationSeconds
              )})`
            : ''
        }
      />
    </div>
  );
}
