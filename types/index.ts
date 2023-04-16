export enum OpenAIModel {
  DAVINCI_TURBO = "gpt-3.5-turbo"
}

export type HuberbotChunk = {
  pageContent: string;
  source: string;
  metadata: Metadata;
  length: number;
};

export interface DefaultSession {
  user: {
    id: null | string;
    email: null | string;
    queriesAllowed: number;
    queriesMade: number;
  };
  expires: string;
};

interface Metadata {
  id: string;
  title: string;
  link: string;
}


export interface ApiCallInput {
  [key: string]: any;
}

export interface ApiCallOutput {
  [key: string]: any;
}