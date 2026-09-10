/* eslint-disable react-dom/no-unsafe-target-blank */
import Image from "next/image";

const logos = [
  {
    name: "Next.js",
    href: "https://nextjs.org/",
    src: "https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png",
  },
  {
    name: "Monaco",
    href: "https://microsoft.github.io/monaco-editor/",
    src: "https://avatars.githubusercontent.com/u/6154722?v=4",
  },
  {
    name: "",
    href: "https://www.mongodb.com/",
    src: "https://webassets.mongodb.com/_com_assets/cms/mongodb-logo-rgb-j6w271g1xn.jpg",
  },
  {
    name: "Tailwind",
    href: "https://tailwindcss.com/",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/tailwindcss.svg",
  },
  {
    name: "Vercel",
    href: "https://vercel.com/",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/vercel.svg",
  },
];

export const SponsorLogos = () => {
  return (
    <div className="w-full pt-10 pb-14">
      
      <p className="text-center text-base font-semibold text-muted-foreground mb-10">
        Our Tech Stack
      </p>

      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16">
        {logos.map((logo, index) => (
          <a
            key={index}
            href={logo.href}
            target="_blank"
            rel="noopener"
            className="flex flex-col items-center gap-3 group transition"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={140}
              height={50}
              className="h-10 md:h-12 w-auto object-contain 
                         opacity-80 group-hover:opacity-100 
                         grayscale group-hover:grayscale-0 
                         transition duration-300"
            />

            <span className="text-sm text-muted-foreground 
                             group-hover:text-foreground transition">
              {logo.name}
            </span>
          </a>
        ))}
      </div>

    </div>
  );
};
