import { IconExternalLink } from "@tabler/icons-react";
import Image from "next/image";
import { FC } from "react";
import king from "../public/hubermanlabicon.jpeg";

export const Navbar: FC = () => {
  return (
    <div className="flex h-[60px] border-b border-gray-300 py-2 px-8 items-center justify-between">
      <div className="font-bold text-2xl flex items-center">
        <a
          className="flex hover:opacity-50 items-center"
          href="https://wait-but-why-gpt.vercel.app"
        >
          <Image
            className="hidden sm:flex"
            src={king}
            alt="GPT powered chat based on Huberman Lab podcast"
            height={40}
          />
          <div className="ml-2">HuberGPT</div>
        </a>
      </div>
      <div>
        <a
          className="flex items-center hover:opacity-50"
          href="https://hubermanlab.com/"
          target="_blank"
          rel="noreferrer"
        >
          <div className="hidden sm:flex">hubermanlab.com</div>

          <IconExternalLink
            className="ml-1"
            size={20}
          />
        </a>
      </div>
    </div>
  );
};
