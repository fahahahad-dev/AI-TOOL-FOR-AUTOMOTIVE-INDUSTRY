import SignInFormClient from "@/modules/auth/components/sign-in-form";
import Image from "next/image";
import React from "react";

const SignInPage = () => {
  return (
    <>
      <div className="flex flex-col items-center">
        <Image
          src="/logo-black.png"
          alt="Login-Image"
          height={150}
          width={300}
          className="object-contain"
        />
      </div>
      <SignInFormClient />
    </>
  );
};

export default SignInPage;
