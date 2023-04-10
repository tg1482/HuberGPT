# HuberGPT

This app enables AI-powered search for Andrew Huberman. 

This is also a testbed for exploring Langchain functionality and building a production-ready app.

This app currently has the following features:
* GPT-3.5 based QA search over Huberman's content
* Giving source transcripts for the answers
* Login authentication with NextAuth
* Database support with Pinecone for embedding and MySql for queries / user login

Future features that I would like to include:
* User profiles for better prompts and customized results
* Allow multiple modes of search (highlevel, detailed, proscons, etc.)
* Show most popular questions and answers per week
* Allow users to add questions to Huberman 
* Cleaner settings:
    - Authentication
    - Profile
    - Search parameters
    - Action Buttons
* Cron job to give updates on app activity
* Cache for Db queries


## Services Used

* GPT 3.5 API - [OpenAI API](https://platform.openai.com/account/usage)
* Vector Database - [Pinecone](https://app.pinecone.io/organizations/-NSF28yCohvGNkY0XNGu/projects/us-east4-gcp:7c9ad57/indexes/huberbot)
* Payment Gateway - [Stripe](https://dashboard.stripe.com/payments)
* MySQL Database - [PlanetScale](https://app.planetscale.com/tg1482/hubergpt)
* Web Server - [Vercel](https://vercel.com/tg1482/huber-gpt)
* Helpful Partner - [ChatGPT](https://chat.openai.com/chat)


## Dataset
 
Get all videos from 

Trascribe all episodes with Whisper.
 
Transcribed data is split / embedded (Pinecone) with Langchain.

All steps outlined in: `scripts/get_data_huberman.ipynb`
TODO: add script to automate this process.

## Search

Use Langchain `VectorDBQAChain` to: 
* Embed the user query
* Perform similarity search on Pinecone embeddings
* Synthesize the answer from relevant chunks with `GPT 3.5`

## Search

Relevant chunks with metadata (links) are displayed as source documents.
 
This builds on the excellent UI from https://github.com/mckaywrigley/wait-but-why-gpt.

## Deploy

Note: the app that supports streaming is deployed to vercel.app: https://huber-gpt.vercel.app/

## Credits

Thanks to [Mckay Wrigley](https://twitter.com/mckaywrigley) for open-sourcing his UI.
 
Thanks to Andrew Huberman for the excellent podcast.

