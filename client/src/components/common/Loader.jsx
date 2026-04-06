const Loader = ({ text = 'Loading...' }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slatebg dark:bg-navydark">
      <div className="rounded-2xl bg-white px-6 py-4 shadow-soft dark:bg-slate-900">
        <p className="animate-pulse text-sm font-medium text-slate-600 dark:text-slate-300">{text}</p>
      </div>
    </div>
  );
};

export default Loader;
