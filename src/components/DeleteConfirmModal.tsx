import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  sessionDescription: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sessionDescription,
}) => {
  const [deleting, setDeleting] = React.useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Usunąć ten trening?
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Czy na pewno chcesz usunąć trening{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {sessionDescription}
          </span>
          ? Tej operacji nie można cofnąć.
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={onClose}
            type="button"
            disabled={deleting}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleDelete}
            type="button"
            disabled={deleting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-600/30 transition-all flex items-center gap-2"
          >
            {deleting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Usuń</span>
          </button>
        </div>
      </div>
    </div>
  );
};
