import Link from "next/link";
import { Github } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center text-center space-y-5">
        
        {/* Logo + Name */}
        <div className="flex items-center gap-2">
          <Image src="/logo-white.png" height={46} width={150} alt="Logo" />
          {/* <span className="text-base font-medium tracking-tight">
            AI Automotive Tool — FYP
          </span> */}
        </div>

        {/* Social Links */}
        <div className="flex gap-4">
          <Link
            href="#"
            target="_blank"
            className="p-2 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50 transition"
          >
            <Github className="w-5 h-5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100" />
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 tracking-wide">
          © {new Date().getFullYear()} Final Year Project — Automotive AI System
        </p>

      </div>
    </footer>
  );
}
