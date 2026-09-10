import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-slate-800 flex items-center justify-center">
      <div className="flex flex-wrap items-center justify-center gap-6 px-4 w-full max-w-5xl">
        {children}
      </div>
    </main>
  );
};

export default AuthLayout;
