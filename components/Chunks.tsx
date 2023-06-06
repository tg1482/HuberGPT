import React from "react";
import { HuberbotChunk } from "@/types";
import Image from "next/image";
import { IconExternalLink } from "@tabler/icons-react";

interface ChunksProps {
  chunks: HuberbotChunk[];
}

export const Chunks: React.FC<ChunksProps> = ({ chunks }) => {
  return (
    <div className="mt-6 pb-16">
      <div className="font-bold text-2xl">Passages</div>
      {chunks.map((chunk, index) => (
        <div key={index}>
          <div className="mt-4 border border-zinc-600 rounded-lg p-4">
            <div className="flex justify-between">
              <div className="flex items-center">
                <Image className="rounded-lg" src={"/" + chunk.metadata.id + ".jpg"} width={103} height={70} alt={chunk.metadata.title} />
                <div className="ml-4">
                  <div className="font-bold text-xl">{chunk.metadata.title}</div>
                </div>
              </div>
              <a className="hover:opacity-50 ml-4" href={chunk.metadata.link} target="_blank" rel="noreferrer">
                <IconExternalLink />
              </a>
            </div>
            <div className="mt-4">{chunk.pageContent}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
