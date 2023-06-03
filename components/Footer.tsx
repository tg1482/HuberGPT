import { IconBrandGithub, IconBrandTwitter } from "@tabler/icons-react";
import { FC } from "react";

export const Footer: FC = () => {
  return (
    <div className="flex flex-row border-t border-gray-300 py-2 px-8 items-center sm:justify-between justify-start whitespace-nowrap overflow-x-auto">
      <div className="hidden sm:flex"></div>

      <div className="flex italic text-sm">
        Created by
        <a className="hover:opacity-50 mx-1" href="https://twitter.com/tanmayg173" target="_blank" rel="noreferrer">
          Tanmay Gupta.
        </a>
        Based on
        <a className="hover:opacity-50 ml-1" href="https://twitter.com/hubermanlab" target="_blank" rel="noreferrer">
          Prof Andrew Huberman's
        </a>
        <a className="hover:opacity-50 ml-1" href="https://hubermanlab.com/" target="_blank" rel="noreferrer">
          Podcast
        </a>
        . Credits due to
        <a className="hover:opacity-50 mx-1" href="https://twitter.com/RLanceMartin" target="_blank" rel="noreferrer">
          Lance Martin
        </a>
        for his open source
        <a className="hover:opacity-50 ml-1" href="https://github.com/PineappleExpress808/lex-gpt" target="_blank" rel="noreferrer">
          contributions
        </a>
        .
      </div>

      <div className="hidden sm:flex"></div>

      {/* <div className="flex space-x-4">
        <a className="flex items-center hover:opacity-50" href="https://twitter.com/tanmayg173" target="_blank" rel="noreferrer">
          <IconBrandTwitter size={24} />
        </a>

        <a className="flex items-center hover:opacity-50" href="https://github.com/tg1482" target="_blank" rel="noreferrer">
          <IconBrandGithub size={24} />
        </a>
      </div> */}
    </div>
  );
};
