import { Answer } from "@/components/Answer/Answer";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { HuberbotChunk,DefaultSession } from "@/types";
import { IconArrowRight,IconExternalLink,IconSearch } from "@tabler/icons-react";
import Head from "next/head";
import Image from "next/image";
import { KeyboardEvent,useEffect,useRef,useState } from "react";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { signIn,signOut,getSession,useSession,SessionProvider,getCsrfToken } from "next-auth/react";
import { Session } from "next-auth";
import { useRouter } from "next/router";
import { loadStripe } from "@stripe/stripe-js";

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

  const [showSettings,setShowSettings] = useState<boolean>(false);
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
  const router = useRouter();

  const { data: session } = useSession();

  console.log(session);

  const setSessionState = (user: any) => {
    console.log("Setting stage",user)
    if (user) {
      setFreeQueries(user.queriesAllowed);
      setQueryCount(user.queriesMade);
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

  // Handle answer 
  const handleAnswer = async () => {

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
    } else {
      if (useAPIKey && apiKey.length === 51) {
        setOpenAPILimit(false);
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
    setUserAuthorized(getUserAuthorization());
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
    setUserAuthorized(getUserAuthorization());
    inputRef.current?.focus();
  };

  const handleClear = () => {
    localStorage.removeItem("PG_KEY");
    localStorage.removeItem("QUERY_COUNT");
    // localStorage.removeItem("PG_MATCH_COUNT");
    // localStorage.removeItem("PG_MODE");

    setApiKey("");
    setQueryCount(0);
    setUserAuthorized(getUserAuthorization());
    setUseEmailPassword(false);
    setUseAPIKey(false);
    setShowPlans(false);
  };


  const handleSignIn = async () => {
    setError(null);

    const result = await signIn("credentials",{
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      const session = await getSession();
      if (session) {
        // The user is now signed in; handle the signed-in state here.
        console.log("User is signed in:",session.user);
        setSessionState(session.user);
        setUserSignedIn(true);
        setShowPlans(false);
        setShowSettings(false);
      } else {
        // The sign-in attempt failed; handle the error here.
        setError("Something going on");
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };


  const handleFreeSignup = async () => {
    try {
      // check email and password are valid
      if (email === '' || password === '') {
        throw new Error('Please enter a valid email and password.');
      }

      const response = await fetch('/api/signup',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email,password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      console.log("User created successfully!");

      const responseBody = await response.json();
      const userId = parseInt(responseBody.userId);

      await createSubscription("1",userId);

      console.log("Subscription created successfully!");

      // sign in
      await handleSignIn();

    } catch (err: any) {
      console.error('Error:',err.message);
      alert(err.message);
    }
  };

  const createSubscription = async (planId: string,userId: number) => {
    const res = await fetch("/api/create-subscription",{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planId,userId }),
    });

    const data = await res.json();

    if (data.status === "success" && planId === "2") {
      redirectToCheckout(data.priceId);
    }
  };


  const redirectToCheckout = async (priceId: string) => {
    const stripePromise = loadStripe("your_stripe_public_key");

    const stripe = await stripePromise;
    if (stripe) {
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId,quantity: 1 }],
        mode: "subscription",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      if (error) {
        console.error("Error:",error);
      }
    }
  };

  interface RenderButtonsProps {
    showLogoutButton: boolean;
    showSaveButton: boolean;
    showClearButton: boolean;
    onLogout: () => void;
    onSave: () => void;
    onClear: () => void;
  }

  const renderButtons = ({
    showLogoutButton,
    showSaveButton,
    showClearButton,
    onLogout,
    onSave,
    onClear,
  }: RenderButtonsProps) => (
    <div className="mt-4 flex space-x-2 justify-center">


      {/* {showLoginButton && (
        <button
          className="flex cursor-pointer items-center space-x-2 space-y-2 rounded-full bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
          onClick={onLogin}
        >
          Login
        </button>
      )}

      {showSignupButton && (
        <button
          className="flex cursor-pointer items-center space-x-2 space-y-2 rounded-full bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
          onClick={onSignup}
        >
          Signup
        </button>
      )} */}


      {showSaveButton && (
        <div
          className="flex cursor-pointer items-center space-x-2 rounded-full bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
          onClick={onSave}
        >
          Save
        </div>
      )}

      {showClearButton && (
        <div
          className="flex cursor-pointer items-center space-x-2 rounded-full bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
          onClick={onClear}
        >
          Clear
        </div>
      )}


      {showLogoutButton && (
        <button
          className="flex cursor-pointer items-center space-x-2 space-y-2 rounded-full bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
          onClick={onLogout}
        >
          Logout
        </button>
      )}
    </div>
  );




  useEffect(() => {
    const PG_KEY = localStorage.getItem("PG_KEY");
    const QUERY_COUNT = localStorage.getItem("QUERY_COUNT");

    if (QUERY_COUNT) {
      setQueryCount(parseInt(QUERY_COUNT));
    }

    if (PG_KEY) {
      setApiKey(PG_KEY);
    }

    setUserAuthorized(getUserAuthorization());
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

                {userSignedIn ? (
                  <div className="mt-2">
                    <div className="mt-2">
                      Logged In as {userEmail}
                    </div>
                    {/* <button
                      // className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                      className="flex cursor-pointer items-center space-x-2 space-y-2 rounded-full bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                      onClick={handleSignOut}
                    >
                      Logout
                    </button> */}
                  </div>
                ) : (
                  useEmailPassword && (
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
                          className="mt-2 flex cursor-pointer items-center space-x-2 space-y-2 rounded-full bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                          onClick={() => setShowPlans(true)}
                        >
                          Sign Up
                        </button>
                        <button
                          className="mt-2 flex cursor-pointer items-center space-x-2 space-y-2 rounded-full bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                          onClick={handleSignIn}
                        >
                          Log In
                        </button>
                      </div>
                      {error && (
                        <div className="mt-2 text-red-600">{error}</div>
                      )}
                    </div>
                  )
                )}

                {showPlans && (
                  <div className="flex flex-col items-center">
                    {/* <h1 className="text-3xl font-bold mb-4"> </h1> */}
                    <div className="flex space-x-4">
                      <button
                        className="mt-2 flex cursor-pointer items-center space-x-2 space-y-2 rounded-full bg-blue-700 px-3 py-1 text-sm text-white hover:bg-blue-600"
                        onClick={handleFreeSignup}
                      >
                        5 Free Questions
                      </button>
                      <button
                        className="mt-2 flex cursor-pointer items-center space-x-2 space-y-2 rounded-full bg-blue-700 px-3 py-1 text-sm text-white hover:bg-blue-600"
                        onClick={() => redirectToCheckout("price_id_50_queries")}
                      >
                        $5 for 50 Questions
                      </button>
                    </div>
                  </div>
                )}

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


                {
                  renderButtons({
                    showLogoutButton: userSignedIn,
                    showSaveButton: true,
                    showClearButton: true,
                    onLogout: handleSignOut,
                    onSave: handleSave,
                    onClear: handleClear,
                  })}
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
      </div >
    </>
  );
}
