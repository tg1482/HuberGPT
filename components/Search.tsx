import React, { useState, KeyboardEvent } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { HuberbotChunk, UserProfile } from "@/types";
import { IconSearch } from "@tabler/icons-react";

interface SearchProps {
  apiKey: string;
  userId: number;
  queryCount: number;
  setQueryCount: React.Dispatch<React.SetStateAction<number>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
  setChunks: React.Dispatch<React.SetStateAction<HuberbotChunk[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Search: React.FC<SearchProps> = ({
  apiKey,
  userId,
  queryCount,
  setQueryCount,
  userProfile,
  setUserProfile,
  setAnswer,
  setChunks,
  setLoading,
}) => {
  const [query, setQuery] = useState("");

  // Handle answer
  const handleAnswer = async () => {
    // User profile
    let userProfileString = "This is the profile of the user you're helping: ";
    if (userProfile.ageGroup) {
      userProfileString = userProfileString + `I'm a ${userProfile.ageGroup} year old. `;
    }
    if (userProfile.sex) {
      userProfileString = userProfileString + `I am a ${userProfile.sex}. `;
    }
    if (userProfile.fitnessLevel) {
      userProfileString = userProfileString + `I am ${userProfile.fitnessLevel} in fitness. `;
    }
    if (userProfile.anythingElse) {
      userProfileString = userProfileString + ` ${userProfile.anythingElse}`;
    }

    // Search Parameters
    let searchSettings =
      "I am looking for a high level overview of the topic. Keep your answer about 7 sentences long. Highlight the important parts in bold.";
    if (userProfile.searchParameters === "Detail") {
      searchSettings = `You will give a detailed response to the question, but not too scientific. Break your response into:
                            1. Background in upto 4 sentences.
                            2. Main response in upto 5 sentences.
                            3. And final takeaway in upto 3 sentences.
                            Highlight the important parts in bold.`;
    } else if (userProfile.searchParameters === "Protocol" || query.toLowerCase().includes("protocol")) {
      searchSettings = `I am looking for a detailed protocol for the topic. Break your response into:
                            1. Background in upto 4 sentences.
                            2. The protocol in upto 5 bullet points
                            3. Cautions on the protocol in upto 3 bullet points
                            Highlight the important parts in bold.`;
    }

    // save query to db using save-query endpoint
    const save_query = await fetch("/api/save-query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, userId }),
    });

    setAnswer("");
    setChunks([]);
    setLoading(true);

    const vector_db_search_query = userProfile ? `${userProfile} ${query}` : query;

    // Similarity search for relevant chunks
    const search_results = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: vector_db_search_query }),
    });

    if (!search_results.ok) {
      setLoading(false);
      throw new Error(search_results.statusText);
    }
    const results: HuberbotChunk[] = await search_results.json();
    setChunks(results);

    // Prompt for LLM summarization
    const prompt = `Follow these rules of engagement:
                        1. You are a helpful assistant that accurately answers queries using Andrew Huberman podcast episodes. 
                        2. You will provide an answer to the user's query: "${query}". 
                        3. ${searchSettings}
                        4. Return your response in Markdown format only. It should be well formatted with bold, italics, and bullet points where appropriate.
                        
                        Use the following information to help you answer the question:
                        1. Use the text provided to form your answer, but avoid copying word-for-word from the posts.
                        2. ${userProfileString}.`;

    const ctrl = new AbortController();

    await fetchEventSource("/api/vectordbqa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, apiKey }),
      onmessage: (event) => {
        setLoading(false);
        const data = JSON.parse(event.data);
        if (data.data === "DONE") {
          // Request complete
          setAnswer((prev) => prev + `  \n \n Note: I am an AI language model and not Professor Andrew Huberman.`);
          postCompletion(apiKey, queryCount);
        } else {
          // Stream text
          setAnswer((prev) => prev + data.data);
        }
      },
    });

    if (userId !== -99) {
      // Update the query count in the database
      const update_query_count = await fetch("/api/update-query-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      if (!update_query_count.ok) {
        throw new Error(update_query_count.statusText);
      }
    }
  };

  // Post completion
  const postCompletion = (apiKey: string, queryCount: number) => {
    setQueryCount(queryCount + 1);
    localStorage.setItem("HGPT_QUERY_COUNT", queryCount.toString());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAnswer();
    }
  };

  return (
    <div className="relative w-full mt-4">
      <i className="pi pi-search absolute text-xl left-7 top-1/2 transform -translate-y-1/2" />
      <input
        className="h-12 w-full rounded-full border border-zinc-600 pr-12 pl-11 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 sm:h-16 sm:py-2 sm:pr-16 sm:pl-16 sm:text-lg"
        type="text"
        placeholder="How much water should one consume?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
