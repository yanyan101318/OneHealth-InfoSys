import { Activity } from 'lucide-react'

export default function ECGLoadingScreen({ pageName, visible }) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white text-slate-900 transition-opacity duration-300 dark:bg-slate-950 dark:text-white ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!visible}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-3xl px-6 text-center">
        <Activity className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold tracking-wide">OneHealth InfoSys</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Loading {pageName}...</p>
        <svg
          className="mt-8 h-20 w-full overflow-visible"
          viewBox="0 0 800 100"
          role="img"
          aria-label="Animated ECG heartbeat"
          preserveAspectRatio="none"
        >
          <path
            className="ecg-heartbeat"
            d="M0 50 H230 L270 50 L292 42 L312 58 L335 50 H375 L395 50 L415 8 L445 92 L465 35 L480 50 H530 L550 50 L570 43 L590 57 L610 50 H800"
          />
        </svg>
      </div>
    </div>
  )
}
