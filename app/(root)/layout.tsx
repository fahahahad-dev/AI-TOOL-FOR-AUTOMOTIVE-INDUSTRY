import { Footer } from "@/modules/home/footer";
import { Header } from "@/modules/home/header";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Features } from "@/modules/home/Features";

export const metadata: Metadata = {
  title: {
    template: "AI Tool for Automotive Industry – %s",
    default: "AI Tool for Automotive Industry – FYP Project",
  },
  description:
    "Final Year Project: AI-powered MISRA C code generation and validation tool designed for the automotive industry.",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />

      {/* Clean Modern Background */}
      <div
        className={cn(
          "absolute inset-0 -z-10",
          "bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-black dark:via-neutral-950 dark:to-neutral-900"
        )}
      />

      {/* Soft radial glow center */}
      <div className="absolute inset-0 -z-10 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,white_0%,transparent_70%)] dark:[mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_70%)]" />

      <main className="relative w-full">
        
        {children}
        
        <Features />

      </main>
      <Footer />
    </>
  );
}
