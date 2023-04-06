import { PineconeStore } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { PineconeClient } from "@pinecone-database/pinecone";
import { NextApiRequest,NextApiResponse } from "next";

type Data = {};
const handler = async (req: NextApiRequest,res: NextApiResponse<Data>) => {

  // Query 
  const query = req.body.query;

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
  // Return chunks to display as references 
  const results = await vectorStore.similaritySearch(query,7);
  res.status(200).send(results);
}

export default handler;