"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/modules/landing/Section";
import { SponsorLogos } from "@/modules/landing/sponsorLogos";

const terminalLines = [
  "Initializing Automotive AI System...",
  "Loading MISRA C Compliance Engine...",
  "Scanning ECU Files...",
  "Analyzing Code for Critical Safety Violations...",
  "Generating AI Recommendations...",
  "System Ready › type `start` to begin",
];

export default function Home() {
  const [displayText, setDisplayText] = useState("");
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (lineIndex >= terminalLines.length) return;

    let currentLine = terminalLines[lineIndex];
    let charIndex = 0;

    const typer = setInterval(() => {
      setDisplayText((prev) => {
        const lines = prev.split("\n");
        lines[lineIndex] = currentLine.slice(0, charIndex);
        return lines.join("\n");
      });

      charIndex++;

      if (charIndex > currentLine.length) {
        clearInterval(typer);
        setTimeout(() => setLineIndex((prev) => prev + 1), 500);
      }
    }, 35);

    return () => clearInterval(typer);
  }, [lineIndex]);

  return (
   <main>
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Left content */}
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-5xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  AI Tool for Automotive Industry
                </span>
              </h1>
              <p className="mt-4 text-gray-600 sm:text-lg md:text-xl">
                Next-generation AI system to generate, validate, and optimize
                MISRA C-compliant automotive code for embedded systems.
              </p>

              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Link href="/dashboard">
                  <Button className="h-12 px-6 sm:px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-base sm:text-lg font-semibold">
                    Launch Tool
                  </Button>
                </Link>
              </div>
            </div>

            {/* RIGHT SIDE - TERMINAL */}
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-3xl" />

              <div className="relative rounded-2xl bg-black border border-neutral-800 shadow-2xl overflow-hidden w-full">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>

                {/* Terminal body */}
                <div className="p-4 sm:p-6">
                  <pre className="text-green-400 text-xs sm:text-sm md:text-base font-mono whitespace-pre-wrap leading-relaxed min-h-[180px]">
                    {displayText}
                    <span className="animate-pulse">█</span>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="pt-12">
        <SponsorLogos />
      </div>
    </main>
  );
}
