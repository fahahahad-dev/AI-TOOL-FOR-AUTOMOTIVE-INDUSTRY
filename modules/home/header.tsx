// header.tsx (NO "use client")
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { auth } from "@/auth";
import UserButton from "../auth/components/user-button";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/60 dark:bg-black/20 border-b">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-white.png" alt="Logo" height={38} width={120} />
        </Link>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <UserButton user={session.user} />
          ) : (
            <Link href="/auth/login">
              <button className="px-4 py-2 rounded-md bg-blue-600 text-white">
                Login
              </button>
            </Link>
          )}
          <Menu className="sm:hidden w-5 h-5" />
        </div>

      </div>
    </header>
  );
}
