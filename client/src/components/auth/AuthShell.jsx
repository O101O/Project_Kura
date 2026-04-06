import { CheckCircle2 } from 'lucide-react';

const AuthShell = ({ children }) => {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-indigo-600 to-blue-500 px-14 py-12 lg:flex">
        <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute left-12 top-10 h-28 w-28 rounded-full border border-white/20" />
        <div className="relative z-10 flex max-w-lg flex-col justify-center text-white animate-fadeIn">
          <span className="mb-6 inline-flex w-fit rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium tracking-wide">
            Kura Workspace Chat
          </span>
          <h1 className="text-5xl font-extrabold leading-tight">A place for meaningful conversations</h1>
          <p className="mt-5 text-lg text-indigo-100">
            Bring teams, communities, and friends together in one premium messaging experience built for fast collaboration.
          </p>
          <div className="mt-8 space-y-3 text-sm text-indigo-100">
            <p className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Real-time messaging and presence</p>
            <p className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Focused, elegant interface</p>
            <p className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Secure auth and account recovery</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-12">
        {children}
      </section>
    </main>
  );
};

export default AuthShell;
