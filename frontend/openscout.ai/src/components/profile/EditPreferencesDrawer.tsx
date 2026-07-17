import React, { useEffect } from 'react';
import { PreferencesForm } from '../onboarding/PreferencesForm';
import { UserPreferences } from '../../types';
import { X } from 'lucide-react';

interface EditPreferencesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: UserPreferences;
  onSubmit: (data: UserPreferences) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditPreferencesDrawer({
  isOpen,
  onClose,
  initialValues,
  onSubmit,
  isSubmitting = false,
}: EditPreferencesDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl h-full bg-[#070b16] border-l border-slate-900 shadow-2xl flex flex-col z-10 animate-[slideIn_0.3s_ease]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-900">
          <div>
            <h3 className="text-lg font-bold font-display text-white">Edit Your Preferences</h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Adjust filters, framework lists, and goals to instantly calibrate repository suggestions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Form Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar">
          <PreferencesForm
            initialValues={initialValues}
            onSubmit={async (data) => {
              await onSubmit(data);
              onClose();
            }}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
