import { ChevronDown, MessageCircleMore, ShieldCheck, Sparkles } from 'lucide-react';
import kuraLogo from '../../assets/Kura messaging logo design.png';

const AuthShell = ({ children }) => {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#f4f4f8] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(161,84,255,0.18),transparent_24%),radial-gradient(circle_at_48%_18%,rgba(69,108,255,0.14),transparent_22%),radial-gradient(circle_at_85%_36%,rgba(29,217,210,0.16),transparent_28%)]" />
      <div className="pointer-events-none absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-brand-200/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-6 right-[-4rem] h-72 w-72 rounded-full bg-accent-200/70 blur-3xl" />

      <header className="relative z-10 px-6 py-5 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center">
            <img
              src={kuraLogo}
              alt="Kura logo"
              className="h-14 w-auto object-contain sm:h-16"
            />
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 lg:flex">
            <a href="#features" className="inline-flex items-center gap-1 hover:text-brand-600">
              Features
              <ChevronDown size={14} />
            </a>
            <a href="#privacy" className="hover:text-brand-600">Privacy and Safety</a>
            <a href="#developers" className="hover:text-brand-600">For Developers</a>
            <a href="#help" className="hover:text-brand-600">Help Center</a>
          </nav>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 pb-12 pt-4 lg:px-12 lg:pb-24">
        <section className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <div className="max-w-xl animate-fadeIn">
            <h1 className="kura-gradient-text text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              A place for meaningful conversations
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Kura helps you connect with your community, build trusted circles, and keep every conversation safe, personal, and easy to follow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
              <span id="features" className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm ring-1 ring-brand-100">
                <Sparkles size={14} className="text-brand-500" />
                Features
              </span>
              <span id="privacy" className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm ring-1 ring-brand-100">
                <ShieldCheck size={14} className="text-brand-500" />
                Privacy and Safety
              </span>
              <span id="help" className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm ring-1 ring-brand-100">
                <MessageCircleMore size={14} className="text-brand-500" />
                Help Center
              </span>
            </div>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[minmax(320px,380px)_minmax(260px,1fr)]">
            <div className="order-2 lg:order-1">
              {children}
            </div>

            <div className="relative order-1 hidden min-h-[480px] animate-fadeIn lg:block lg:order-2">
              <div className="absolute left-8 top-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,#a154ff_0%,#456cff_55%,#1dd9d2_100%)] shadow-lg shadow-cyan-200/30">
                <span className="text-3xl">?</span>
              </div>

              <div className="absolute right-0 top-8 w-[255px] rounded-[2rem] bg-white/82 p-4 shadow-[0_30px_80px_-30px_rgba(91,43,198,0.34)] ring-1 ring-brand-100 backdrop-blur">
                <div className="mb-4 flex items-center justify-between text-slate-900">
                  <span className="text-lg font-bold text-slate-900">Kura</span>
                  <div className="h-6 w-6 rounded-full border border-slate-200 bg-white" />
                </div>
                <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(245,239,255,0.9),rgba(232,249,255,0.9))] px-4 py-3 text-sm text-slate-500">Search</div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[linear-gradient(135deg,#d8b8ff,#b8d4ff)]" />
                    <div className="flex-1">
                      <div className="h-3 w-24 rounded-full bg-slate-200" />
                      <div className="mt-2 h-3 w-32 rounded-full bg-slate-100" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[linear-gradient(135deg,#bf88ff,#456cff)]" />
                    <div className="flex-1">
                      <div className="h-3 w-20 rounded-full bg-slate-200" />
                      <div className="mt-2 h-3 w-28 rounded-full bg-slate-100" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[linear-gradient(135deg,#69e8f9,#1dd9d2)]" />
                    <div className="flex-1">
                      <div className="h-3 w-16 rounded-full bg-slate-200" />
                      <div className="mt-2 h-3 w-24 rounded-full bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-[290px] rounded-[2rem] bg-[linear-gradient(180deg,rgba(245,239,255,0.96)_0%,rgba(221,235,255,0.96)_52%,rgba(221,255,251,0.94)_100%)] p-4 shadow-[0_30px_80px_-30px_rgba(91,43,198,0.38)] ring-1 ring-brand-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Veronica Jones</p>
                    <p className="text-xs text-slate-500">Active now</p>
                  </div>
                  <div className="h-6 w-6 rounded-full border border-blue-200 bg-white/70" />
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-slate-700 shadow-sm">
                    Hey! Hope you're having a wonderful day.
                  </div>
                  <div className="ml-auto max-w-[74%] rounded-2xl rounded-br-md bg-[linear-gradient(135deg,#8d31ff_0%,#456cff_58%,#1dd9d2_100%)] px-4 py-3 text-white shadow-sm">
                    Thanks! Just checking in before we chat later.
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="rounded-2xl bg-[linear-gradient(135deg,#311f61,#23336a,#0e7490)] px-4 py-3 text-white">
                      <div className="text-sm font-medium">Veronica is typing...</div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-white/80" />
                        <span className="h-2 w-2 rounded-full bg-white/65" />
                        <span className="h-2 w-2 rounded-full bg-white/50" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">Typing indicator</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-24 right-[-0.5rem] h-16 w-16 rounded-[1.5rem] bg-accent-200/80 blur-[1px]" />
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 px-6 py-5 text-sm text-slate-500 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-slate-200/80 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="font-medium text-slate-700">Kura 2026</div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="#privacy-policy" className="hover:text-brand-600">Privacy Policy</a>
            <a href="#cookie-policy" className="hover:text-brand-600">Cookie Policy</a>
            <a href="#cookie-settings" className="hover:text-brand-600">Cookie Settings</a>
            <a href="#terms" className="hover:text-brand-600">Terms</a>
            <a href="#language" className="hover:text-brand-600">English (US)</a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default AuthShell;
