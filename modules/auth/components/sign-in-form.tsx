import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chrome, Github } from "lucide-react";
import { signIn } from "@/auth";

async function handleGoogleSignIn() {
  "use server";
  await signIn("google");
}

async function handleGithubSignIn() {
  "use server";
  await signIn("github");
}

const SignInFormClient = () => {
  return (
    <Card className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-4">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
        <CardDescription className="text-slate-300">
          Sign in to continue
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3">
        <form action={handleGoogleSignIn}>
          <Button
            type="submit"
            variant="outline"
            className="w-full border-slate-600 text-slate hover:text-white hover:bg-slate-700/60"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </form>

        <form action={handleGithubSignIn}>
          <Button
            type="submit"
            variant="outline"
            className="w-full border-slate-600 text-slate hover:text-white hover:bg-slate-700/60"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-xs text-center text-slate-400 w-full">
          By signing in, you agree to our{" "}
          <a href="#" className="underline text-blue-400">
            Terms of Service
          </a>{" "}
          &{" "}
          <a href="#" className="underline text-blue-400">
            Privacy Policy
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  );
};

export default SignInFormClient;
