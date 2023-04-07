import { Answer } from "@/components/Answer/Answer";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Signup from "@/components/Signup";
import { HuberbotChunk } from "@/types";
import { IconArrowRight,IconExternalLink,IconSearch } from "@tabler/icons-react";
import Head from "next/head";
import Image from "next/image";
import { KeyboardEvent,useEffect,useRef,useState } from "react";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { signIn,signOut,useSession,SessionProvider,getCsrfToken } from "next-auth/react";
import { Session } from "next-auth";
import { useRouter } from "next/router";
import { saveQuery } from "@/lib/db";



function HomeWrapper({ session }: { session: Session }) {
  return (
    <SessionProvider session={session}>
      <Home />
    </SessionProvider>
  );
}

export default HomeWrapper;

function Home() {

  const inputRef = useRef<HTMLInputElement>(null);

  const [query,setQuery] = useState<string>("");
  const [chunks,setChunks] = useState<HuberbotChunk[]>([]);
  const [answer,setAnswer] = useState<string>("");
  const [loading,setLoading] = useState<boolean>(false);

  const [mode,setMode] = useState<"search" | "chat">("chat");
  const [queryCount,setQueryCount] = useState<number>(0);
  const [freeQueries,setFreeQueries] = useState<number>(1);
  const [openAPILimit,setOpenAPILimit] = useState<boolean>(true);

  const [showSettings,setShowSettings] = useState<boolean>(false);
  const [showPlans,setShowPlans] = useState(false);
  const [useEmailPassword,setUseEmailPassword] = useState<boolean>(false);
  const [useAPIKey,setUseAPIKey] = useState<boolean>(false);

  const [apiKey,setApiKey] = useState<string>("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const [userAuthorized,setUserAuthorized] = useState<boolean>(false);
  const router = useRouter();

  const { data: session } = useSession();

  console.log(session);

  useEffect(() => {
    if (session) {
      setFreeQueries(1);
    }
  },[session]);

  // Handle answer 
  const handleAnswer = async () => {

    // if (queryCount >= freeQueries && !session) {
    //   handleSignIn();
    //   return;
    // }

    if (session && session.user) {
      saveQuery({
        user_id: session.user.id as string,
        query: query as string,
        answer: answer as string,
        created_at: new Date() as Date,
      });
    }


    setAnswer("");
    setChunks([]);
    setLoading(true);

    // Similarity search for relevant chunks 
    const search_results = await fetch("/api/search",{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    if (!search_results.ok) {
      setLoading(false);
      throw new Error(search_results.statusText);
    }
    const results: HuberbotChunk[] = await search_results.json();
    setChunks(results);

    // Prompt for LLM summarization
    const prompt = `You are a helpful assistant that accurately answers queries using Andrew Huberman podcast episodes. Use the text provided to form your answer, but avoid copying word-for-word from the posts. Try to use your own words when possible. Keep your answer under 5 sentences. Be accurate, helpful, concise, and clear. Use the following passages to provide an answer to the query: "${query}"`
    const ctrl = new AbortController();

    fetchEventSource("/api/vectordbqa",{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt,apiKey }),
      onmessage: (event) => {
        setLoading(false);
        const data = JSON.parse(event.data);
        if (data.data === "DONE") {
          // Request complete 
          postCompletion(apiKey,queryCount);
        } else {
          // Stream text
          setAnswer((prev) => prev + data.data);
        }
      }
    });
  };


  const getUserAuthorization = (apiKey: string,queryCount: number) => {
    if (queryCount < freeQueries || session) {
      return true;
    } else {
      if (useAPIKey && apiKey.length === 51) {
        setOpenAPILimit(false);
        return true;
      } else if (useEmailPassword && session) {
        return true;
      } else {
        setOpenAPILimit(true);
        return false;
      }
    }
  };


  const postCompletion = (apiKey: string,queryCount: number) => {
    setQueryCount(queryCount + 1);
    localStorage.setItem("QUERY_COUNT",queryCount.toString());
    setUserAuthorized(getUserAuthorization(apiKey,queryCount));
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAnswer();
    }
  };

  const handleSave = () => {
    if (apiKey.length !== 51) {
      alert("Please enter a valid API key.");
      return;
    }

    localStorage.setItem("PG_KEY",apiKey);
    // localStorage.setItem("PG_MATCH_COUNT",matchCount.toString());
    // localStorage.setItem("PG_MODE",mode);

    setShowSettings(false);
    setUserAuthorized(getUserAuthorization(apiKey,queryCount));
    inputRef.current?.focus();
  };

  const handleClear = () => {
    localStorage.removeItem("PG_KEY");
    localStorage.removeItem("QUERY_COUNT");
    // localStorage.removeItem("PG_MATCH_COUNT");
    // localStorage.removeItem("PG_MODE");

    setApiKey("");
    setQueryCount(0);
    setUserAuthorized(getUserAuthorization(apiKey,queryCount));
    setUseEmailPassword(false);
    setUseAPIKey(false);
    setShowPlans(false);
  };

  // const handleSignUp = () => {
  //   router.push("/signup");
  // };

  const handleSignIn = () => {
    signIn("email",{ email,password });
  };


  useEffect(() => {
    const PG_KEY = localStorage.getItem("PG_KEY");
    const QUERY_COUNT = localStorage.getItem("QUERY_COUNT");

    if (QUERY_COUNT) {
      setQueryCount(parseInt(QUERY_COUNT));
    }

    if (PG_KEY) {
      setApiKey(PG_KEY);
    }

    setUserAuthorized(getUserAuthorization(apiKey,queryCount));
    inputRef.current?.focus();
  },[]);

  // Render page
  return (
    <>
      <Head>
        <title>HuberGPT</title>
        <meta
          name="description"
          content={`AI-powered search and chat for the Huberman Lab podcast. `}
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <link
          rel="icon"
          href="/hubermanlabicon.jpeg"
        />
      </Head>

      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex h-full w-full max-w-[750px] flex-col items-center px-3 pt-4 sm:pt-8">
            <button
              className="mt-4 flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm hover:opacity-50"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? "Hide" : "Show"} Settings
            </button>
            {showSettings && (
              <div className="w-[340px] sm:w-[400px]">
                <div className="mt-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="emailPassword"
                        name="authOption"
                        value="emailPassword"
                        checked={useEmailPassword}
                        onChange={() => {
                          setUseEmailPassword(true);
                          setUseAPIKey(false);
                        }}
                      />
                      <label htmlFor="emailPassword" className="ml-2">
                        Email and Password
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="apiKey"
                        name="authOption"
                        value="apiKey"
                        checked={useAPIKey}
                        onChange={() => {
                          setUseAPIKey(true);
                          setUseEmailPassword(false);
                          setShowPlans(false);
                        }}
                      />
                      <label htmlFor="apiKey" className="ml-2">
                        OpenAI API Key
                      </label>
                    </div>
                  </div>
                </div>

                {useEmailPassword && (
                  <div className="mt-2">
                    <div>Email</div>
                    <input
                      type="email"
                      placeholder="Email"
                      className="max-w-[400px] block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="mt-2">Password</div>
                    <input
                      type="password"
                      placeholder="Password"
                      className="max-w-[400px] block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="flex space-x-4">
                      <button
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => setShowPlans(true)}
                      >
                        Sign Up
                      </button>
                      <button
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={handleSignIn}
                      >
                        Log In
                      </button>
                    </div>
                  </div>
                )}

                {showPlans && <Signup />}

                {useAPIKey && (
                  <div className="mt-2">
                    <div>OpenAI API Key</div>
                    <input
                      type="password"
                      placeholder="OpenAI API Key"
                      className="max-w-[400px] block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);

                        if (e.target.value.length !== 51) {
                          setShowSettings(true);
                        }
                      }}
                    />
                  </div>
                )}


                {/* add some space above and a thin outline */}
                <div className="mt-4">
                  Queries executed: {queryCount} / {openAPILimit ? freeQueries : '∞'}
                </div>


                <div className="mt-4 flex space-x-2 justify-center">
                  <div
                    className="flex cursor-pointer items-center space-x-2 rounded-full bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                    onClick={handleSave}
                  >
                    Save
                  </div>

                  <div
                    className="flex cursor-pointer items-center space-x-2 rounded-full bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                    onClick={handleClear}
                  >
                    Clear
                  </div>
                </div>
              </div>
            )}

            {userAuthorized ? (
              <div className="relative w-full mt-4">
                <IconSearch className="absolute top-3 w-10 left-1 h-6 rounded-full opacity-50 sm:left-3 sm:top-4 sm:h-8" />
                <input
                  ref={inputRef}
                  className="h-12 w-full rounded-full border border-zinc-600 pr-12 pl-11 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 sm:h-16 sm:py-2 sm:pr-16 sm:pl-16 sm:text-lg"
                  type="text"
                  placeholder="How much water should one consume?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            ) : (
              <div className="text-center font-bold text-3xl mt-7">
                Please enter your
                <a
                  className="mx-2 underline hover:opacity-50"
                  href="https://platform.openai.com/account/api-keys"
                >
                  OpenAI API key
                </a>
                in settings.
              </div>
            )}

            {loading ? (
              <div className="mt-6 w-full">

                <div className="font-bold text-2xl mt-6">Passages</div>
                <div className="animate-pulse mt-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded mt-2"></div>
                  <div className="h-4 bg-gray-300 rounded mt-2"></div>
                  <div className="h-4 bg-gray-300 rounded mt-2"></div>
                  <div className="h-4 bg-gray-300 rounded mt-2"></div>
                </div>
              </div>
            ) : answer ? (
              <div className="mt-6">
                <div className="font-bold text-2xl mb-2">Answer</div>
                <Answer text={answer} />

                <div className="mt-6 mb-16">
                  <div className="font-bold text-2xl">Passages</div>

                  {chunks.map((chunk,index) => (
                    <div key={index}>
                      <div className="mt-4 border border-zinc-600 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <Image
                              className="rounded-lg"
                              src={"/" + chunk.metadata.id + ".jpg"}
                              width={103}
                              height={70}
                              alt={chunk.metadata.title}
                            />
                            <div className="ml-4">
                              <div className="font-bold text-xl">{chunk.metadata.title}</div>
                            </div>
                          </div>
                          <a
                            className="hover:opacity-50 ml-4"
                            href={chunk.metadata.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <IconExternalLink />
                          </a>
                        </div>
                        <div className="mt-4">{chunk.pageContent}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : chunks.length > 0 ? (
              <div className="mt-6 pb-16">
                <div className="font-bold text-2xl">Passages</div>
                {chunks.map((chunk,index) => (
                  <div key={index}>
                    <div className="mt-4 border border-zinc-600 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <Image
                            className="rounded-lg"
                            src={"/" + chunk.metadata.id + ".jpg"}
                            width={103}
                            height={70}
                            alt={chunk.metadata.title}
                          />
                          <div className="ml-4">
                            <div className="font-bold text-xl">{chunk.metadata.title}</div>
                          </div>
                        </div>
                        <a
                          className="hover:opacity-50 ml-2"
                          href={chunk.metadata.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <IconExternalLink />
                        </a>
                      </div>
                      <div className="mt-4">{chunk.pageContent}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 text-center text-lg">{`AI-powered search and chat for the Huberman Lab podcast.`}</div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
