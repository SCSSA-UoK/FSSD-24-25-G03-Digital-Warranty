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
      className="p-2 text-[#2A4434] hover:text-[#0C1E14] dark:text-[#CBD9CD] dark:hover:text-white hover:bg-[#DEE7DC] dark:hover:bg-[#12271B] rounded-full transition cursor-pointer border border-[#CCD8CB] dark:border-[#1A3826]"
      title={`Switch to ${resolvedTheme === 'dark' ? 'Botanical Light' : 'Emerald Forest Dark'} Mode`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4.5 h-4.5 text-[#E5C38F] animate-in spin-in-180 duration-200" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-[#183B27] animate-in spin-in-180 duration-200" />
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
    <div className="bg-[#E2ECE1] dark:bg-[#11291B] rounded-3xl border border-[#BDD0BC] dark:border-[#1E4C32] shadow-xs p-6 space-y-4 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-[#CCD9CB] dark:border-[#183A26]">
        <div>
          <h3 className="text-base font-bold text-[#0C2114] dark:text-[#EDF2EB]">Appearance &amp; Theme</h3>
          <p className="text-xs text-[#476B53] dark:text-[#8EAE9A]">
            Customize how WarranTrack looks on this device across all pages and tables
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#C2D7C1] dark:bg-[#183B27] text-[#133A24] dark:text-[#86E4AE] border border-[#AEC5AD] dark:border-[#27643E]">
          Current: {resolvedTheme === 'dark' ? 'Botanical Forest Dark' : 'Botanical Sage Light'}
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
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 relative cursor-pointer ${
                isSelected
                  ? 'border-[#1E5234] bg-[#C5D8C4] dark:bg-[#183B27] dark:border-[#86E4AE] ring-2 ring-[#1E5234]/30 shadow-xs'
                  : 'border-[#BDD0BC] dark:border-[#1E4C32] hover:border-[#9EB99C] dark:hover:border-[#2C6E48] bg-[#D7E4D6] dark:bg-[#132E1F]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-xl ${
                  isSelected
                    ? 'bg-[#17432A] dark:bg-[#86E4AE] text-white dark:text-[#0C2114]'
                    : 'bg-[#C7D7C6] dark:bg-[#183B27] text-[#2A523A] dark:text-[#A7C8B4]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#17432A] dark:bg-[#86E4AE] text-white dark:text-[#0C2114] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-bold text-[#0C2114] dark:text-[#EDF2EB]">{opt.label}</div>
                <div className="text-xs text-[#476B53] dark:text-[#8EAE9A] mt-0.5 leading-snug">{opt.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
