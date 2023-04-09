import { PineconeStore } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { PineconeClient } from "@pinecone-database/pinecone";
import { NextApiRequest,NextApiResponse } from "next";

type Data = {};
const handler = async (req: NextApiRequest,res: NextApiResponse<Data>) => {
  // Query
  const query = req.body.query;

  // Check if the query is "test"
  const testRegex = /testing|test|test123/;
  if (testRegex.test(query)) {
    const testValues = [
      { id: "1",score: 0.8,text: "Test value 1",metadata: { id: "01",title: "Test title 1" } },
      { id: "2",score: 0.75,text: "Test value 2",metadata: { id: "02",title: "Test title 2" } },
      { id: "3",score: 0.65,text: "Test value 3",metadata: { id: "03",title: "Test title 3" } },
    ];
    res.status(200).send(testValues);
    return;
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
  // Return chunks to display as references
  const results = await vectorStore.similaritySearch(query,7);
  res.status(200).send(results);
};

export default handler;
