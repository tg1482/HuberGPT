import { PineconeStore } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { PineconeClient } from "@pinecone-database/pinecone";
import { VectorDBQAChain } from "langchain/chains";
import { OpenAIChat } from "langchain/llms";
import { CallbackManager } from "langchain/callbacks";
import type { NextApiRequest,NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Inputs 
  const prompt = req.body.prompt;
  const openAIApiKey = req.body.apiKey;

  // If API key is null, set it to the environment variable
  if (openAIApiKey) {
    process.env.OPENAI_API_KEY = openAIApiKey;
  }

  // Vector DB
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "us-east4-gcp",
    apiKey: process.env.PINECONE_API_KEY ?? "",
  });
  const index = pinecone.Index("huberbot");
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),{ pineconeIndex: index },
  );

  // Send data in SSE stream 
  res.writeHead(200,{
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const sendData = (data: string) => {
    if (res.writableEnded) {
      console.log("Response has already ended, cannot write more data");
      return;
    }
    res.write(`data: ${data}\n\n`);
  };

  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    res.write(':heartbeat\n');
  },5 * 1000); // Send heartbeat every 5 seconds

  const testRegex = /testing|test|test123/;
  if (testRegex.test(prompt)) {
    sendData(JSON.stringify({ data: "test answer" }));
    sendData(JSON.stringify({ data: "DONE" }));
    clearInterval(heartbeatInterval);
    res.end();
    return;
  }

  // Call LLM and stream output
  const model = new OpenAIChat({
    temperature: 0.0,
    streaming: true,
    callbackManager: CallbackManager.fromHandlers({
      async handleLLMNewToken(token) {
        sendData(JSON.stringify({ data: token }));
      },
    }),
  });

  const chain = VectorDBQAChain.fromLLM(model,vectorStore);
  chain.returnSourceDocuments = false;
  chain.k = 4;

  try {
    await chain.call({
      query: prompt,
    });
  } catch (err) {
    console.error(err);
    console.log("Error in LLM, sending DONE and closing connection")
  } finally {
    sendData(JSON.stringify({ data: "DONE" }));
    clearInterval(heartbeatInterval);
    res.end();
  }
}