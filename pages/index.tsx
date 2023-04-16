import { Answer } from "@/components/Answer/Answer";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Settings } from "@/components/Settings";
import { HuberbotChunk,DefaultSession } from "@/types";
import { IconArrowRight,IconExternalLink,IconSearch } from "@tabler/icons-react";
import Head from "next/head";
import Image from "next/image";
import { KeyboardEvent,useEffect,useRef,useState } from "react";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { signIn,signOut,getSession,useSession,SessionProvider,getCsrfToken } from "next-auth/react";
import { Session } from "next-auth";
import { useRouter } from "next/router";


// Default session

const defaultSession = {
  user: {
    id: -99,
    email: null,
    queriesAllowed: 2,
    queriesMade: 0,
  },
  expires: new Date().toISOString(),
};

type HubergptSession = Session | DefaultSession;

function HomeWrapper({ session }: { session: HubergptSession }) {
  return (
    <SessionProvider session={session ? session : defaultSession}>
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
  const [error,setError] = useState<string | null>(null);

  const [mode,setMode] = useState<"search" | "chat">("chat");
  const [queryCount,setQueryCount] = useState<number>(0);
  const [freeQueries,setFreeQueries] = useState<number>(1);
  const [openAPILimit,setOpenAPILimit] = useState<boolean>(true);

  const [showSettings,setShowSettings] = useState<boolean>(true);
  const [showPlans,setShowPlans] = useState(false);
  const [useEmailPassword,setUseEmailPassword] = useState<boolean>(false);
  const [useAPIKey,setUseAPIKey] = useState<boolean>(false);

  const [apiKey,setApiKey] = useState<string>("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const [userId,setUserId] = useState<number>(-99);
  const [userEmail,setUserEmail] = useState<string | null>(null);
  const [userSignedIn,setUserSignedIn] = useState<boolean>(false);
  const [userAuthorized,setUserAuthorized] = useState<boolean>(false);

  // profile
  const [userAgeGroup,setUserAgeGroup] = useState("");
  const [userSex,setUserSex] = useState("");
  const [userFitnessLevel,setUserFitnessLevel] = useState("");
  const [userAnythingElse,setUserAnythingElse] = useState("");
  const [userSearchParameters,setUserSearchParameters] = useState<string>("Default");

  const router = useRouter();

  const { data: session } = useSession();

  const setSessionState = async (user: any) => {
    if (user) {
      if (user.id !== -99) {
        const response = await fetch(`/api/get-query-counts?userId=${user.id}`);
        if (response.ok) {
          const { queriesMade,queriesAllowed } = await response.json();
          setFreeQueries(queriesAllowed);
          setQueryCount(queriesMade);
        }
      } else {
        setFreeQueries(user.queriesAllowed);
        setQueryCount(user.queriesMade);
      }
      setUserId(user.id);
      if (user.id !== -99) {
        setUserSignedIn(true);
        setUserEmail(user.email);
      };
    }
  };

  useEffect(() => {
    if (session && session.user) {
      setSessionState(session.user);
    }
  },[session]);


  useEffect(() => {
    const PG_KEY = localStorage.getItem("HGPT_OPENAI_KEY");
    const QUERY_COUNT = localStorage.getItem("HGPT_QUERY_COUNT");
    const USER_AGE = localStorage.getItem("HGPT_USER_AGE");
    const USER_SEX = localStorage.getItem("HGPT_USER_SEX");
    const USER_FITNESS_LEVEL = localStorage.getItem("HGPT_USER_FITNESS_LEVEL");
    const USER_ADDITIONAL_INFO = localStorage.getItem("HGPT_USER_ADDITIONAL_INFO");

    if (QUERY_COUNT) {
      setQueryCount(parseInt(QUERY_COUNT));
    }
    if (PG_KEY) {
      setApiKey(PG_KEY);
    }
    if (USER_AGE) {
      setUserAgeGroup(USER_AGE);
    }
    if (USER_SEX) {
      setUserSex(USER_SEX);
    }
    if (USER_FITNESS_LEVEL) {
      setUserFitnessLevel(USER_FITNESS_LEVEL);
    }
    if (USER_ADDITIONAL_INFO) {
      setUserAnythingElse(USER_ADDITIONAL_INFO);
    }
    setUserAuthorized(getUserAuthorization());
    inputRef.current?.focus();
  },[]);

  // Save session with the latest values when the user leaves the tab
  useEffect(() => {
    const saveSession = () => {
      if (userId == -99 && session) {
        sessionStorage.setItem(
          "session",
          JSON.stringify({ ...session,user: { ...session.user,queriesAllowed: freeQueries,queriesMade: queryCount } })
        );
      }
    };
    saveSession();
  },[freeQueries,queryCount,session,userId]);

  // Handle answer 
  const handleAnswer = async () => {

    // User profile
    let userProfile = "This is the profile of the user you're helping: "
    if (userAgeGroup) {
      userProfile = userProfile + `I'm a ${userAgeGroup} year old. `;
    }
    if (userSex) {
      userProfile = userProfile + `I am a ${userSex}. `;
    }
    if (userFitnessLevel) {
      userProfile = userProfile + `I am ${userFitnessLevel} in fitness. `;
    }
    if (userAnythingElse) {
      userProfile = userProfile + ` ${userAnythingElse}`;
    }

    // Search Parameters
    let searchSettings = "I am looking for a high level overview of the topic. Keep your answer about 7 sentences long. Highlight the important parts in bold.";
    if (userSearchParameters === "Detail") {
      searchSettings = `You will give a detailed response to the question, but not too scientific. Break your response into:
                        1. Background in one paragraph
                        2. Main response in one paragraph
                        3. And final takeaway in one paragraph.
                        Highlight the important parts in bold.`;
    }
    else if (userSearchParameters === "Protocol" || query.toLowerCase().includes("protocol")) {
      searchSettings = `I am looking for a detailed protocol for the topic. Break your response into:
                        1. Background in one paragraph
                        2. The protocol in bullet points
                        3. Cautions on the protocol in bullet points
                        Highlight the important parts in bold.`;
    }

    // save query to db using save-query endpoint
    const save_query = await fetch("/api/save-query",{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query,userId })
    });

    setAnswer("");
    setChunks([]);
    setLoading(true);

    const vector_db_search_query = userProfile ? `${userProfile} ${query}` : query;

    // Similarity search for relevant chunks 
    const search_results = await fetch("/api/search",{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: vector_db_search_query })
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
                    2. ${userProfile}.`

    const ctrl = new AbortController();

    await fetchEventSource("/api/vectordbqa",{
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
          setAnswer((prev) => prev + `  \n \n Note: I am an AI language model and not Professor Andrew Huberman.`);
          postCompletion(apiKey,queryCount);
        } else {
          // Stream text
          setAnswer((prev) => prev + data.data);
        }
      }
    });

    if (userId !== -99) {
      // Update the query count in the database
      const update_query_count = await fetch("/api/update-query-count",{
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });
      if (!update_query_count.ok) {
        throw new Error(update_query_count.statusText);
      }
    };
  };


  const getUserAuthorization = () => {
    if (queryCount < freeQueries) {
      return true;
    } else if (apiKey && apiKey.length == 51) {
      return true;
    }
    return false;
  };


  const postCompletion = (apiKey: string,queryCount: number) => {
    setQueryCount(queryCount + 1);
    localStorage.setItem("HGPT_QUERY_COUNT",queryCount.toString());
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAnswer();
    }
  };

  interface QueryInfoBoxProps {
    apiKey: string;
    queriesMade: number;
    queriesAllowed: number;
  }

  const QueryInfoBox: React.FC<QueryInfoBoxProps> = ({ apiKey,queriesMade,queriesAllowed }) => {
    const limitReachedColor = queriesMade >= queriesAllowed && !apiKey ? "bg-red-500 text-white" : "bg-green-500 text-white";
    return (
      <div className={`mt-2 flex items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm ${limitReachedColor}`}>
        {apiKey && apiKey.length == 51 ? (
          'API Authenticated'
        ) : (
          `${queriesMade} / ${queriesAllowed} Queries`
        )}
      </div>
    );
  };


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
            <Settings
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              queryCount={queryCount}
              setQueryCount={setQueryCount}
              freeQueries={freeQueries}
              setFreeQueries={setFreeQueries}
              openAPILimit={openAPILimit}
              setOpenAPILimit={setOpenAPILimit}
              apiKey={apiKey}
              setApiKey={setApiKey}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              userId={userId}
              setUserId={setUserId}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              userSignedIn={userSignedIn}
              setUserSignedIn={setUserSignedIn}
              userAgeGroup={userAgeGroup}
              setUserAgeGroup={setUserAgeGroup}
              userSex={userSex}
              setUserSex={setUserSex}
              userFitnessLevel={userFitnessLevel}
              setUserFitnessLevel={setUserFitnessLevel}
              userAnythingElse={userAnythingElse}
              setUserAnythingElse={setUserAnythingElse}
              userSearchParameters={userSearchParameters}
              setUserSearchParameters={setUserSearchParameters}
            />
            {getUserAuthorization() ? (
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
                Kindly authenticate using Login or OpenAI API Key in{' '}
                <a className="underline hover:opacity-50" onClick={() => setShowSettings(true)}>
                  Settings
                </a>{' '}
              </div>
            )}
            <QueryInfoBox
              apiKey={apiKey}
              queriesAllowed={freeQueries}
              queriesMade={queryCount}
            />

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
              <div>
                <div className="mt-6 text-center text-lg">{`AI-powered search and chat for the Huberman Lab podcast.`}</div>
                <div className="mt-2 text-center text-lg">{`Your personal data is only saved on your local device.`}</div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div >
    </>
  );
}
