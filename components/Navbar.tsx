import { IconExternalLink } from "@tabler/icons-react";
import Image from "next/image";
import { FC } from "react";
import king from "../public/hubermanlabicon.jpeg";
import Link from "next/link";
import { Settings2 } from "@/components/Settings2";

export const Navbar: FC = () => {
  return (
    <div className="flex h-[60px] border-b border-gray-300 py-2 px-6 items-center justify-between">
      <div className="flex items-center font-bold text-2xl">
        <a className="flex hover:opacity-50 items-center" href="https://wait-but-why-gpt.vercel.app">
          <Image className="hidden sm:flex" src={king} alt="GPT powered chat based on Huberman Lab podcast" height={40} />
          <div className="ml-2">HuberGPT</div>
        </a>
      </div>
      <div>
        <Settings2 />
      </div>
    </div>
  );
};
