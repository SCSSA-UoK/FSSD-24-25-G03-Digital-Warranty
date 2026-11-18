import React from 'react';
import { useTheme, Theme } from '../context/ThemeContext';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

/**
 * Compact Navbar Theme Toggle Button (Light/Dark switch)
 */
export const ThemeToggle: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
      title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400 animate-in spin-in-180 duration-200" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600 animate-in spin-in-180 duration-200" />
      )}
    </button>
  );
};

/**
 * Full Theme Settings Card with Light, Dark, and System Default options
 */
export const ThemeSettingsCard: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const options: { id: Theme; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'light',
      label: 'Light Mode',
      desc: 'Clean, high-contrast light theme optimal for bright workspaces',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      desc: 'Deep slate dark theme designed for low-light comfort and focus',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System Default',
      desc: 'Automatically matches your computer or browser appearance preference',
      icon: Laptop,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Appearance & Theme</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize how WarranTrack looks on this device across all pages and tables
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          Current: {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-3 relative cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-600/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-lg ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{opt.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{opt.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
