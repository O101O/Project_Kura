import React from 'react';

const ToggleSwitch = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2.5 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800">
    <span className="min-w-0 flex flex-col gap-[2px] pr-3">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </span>

    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      aria-pressed={checked}
      className={`relative shrink-0 rounded-full w-[44px] h-[24px] transition-colors duration-200 ${
        checked ? 'bg-gradient-to-r from-purple-600 to-violet-700' : 'bg-slate-300 dark:bg-slate-600'
      }`}
      // keep layout stable: no margins or absolute hacks here
    >
      <span
        className="absolute rounded-full bg-white shadow"
        style={{
          width: '18px',
          height: '18px',
          top: '3px',
          left: checked ? '23px' : '3px',
          transition: 'left 200ms ease'
        }}
      />
    </button>
  </label>
);

export default ToggleSwitch;
