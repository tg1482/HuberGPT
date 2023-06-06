import { Answer } from "@/components/Answer/Answer";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Settings } from "@/components/Settings";
import { Search } from "@/components/Search";
import { Chunks } from "@/components/Chunks";
import { HuberbotChunk, UserProfile } from "@/types";
import Head from "next/head";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";

const defaultUserProfile: UserProfile = {
  ageGroup: "",
  sex: "",
  fitnessLevel: "",
  anythingElse: "",
  searchParameters: "Default",
};

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [chunks, setChunks] = useState<HuberbotChunk[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [queryCount, setQueryCount] = useState<number>(0);
  const [freeQueries, setFreeQueries] = useState<number>(1);

  const [showSettings, setShowSettings] = useState<boolean>(true);

  const [apiKey, setApiKey] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [userId, setUserId] = useState<number>(-99);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userSignedIn, setUserSignedIn] = useState<boolean>(false);
  const [userAuthorized, setUserAuthorized] = useState<boolean>(false);

  // profile
  const [userAgeGroup, setUserAgeGroup] = useState("");
  const [userSex, setUserSex] = useState("");
  const [userFitnessLevel, setUserFitnessLevel] = useState("");
  const [userAnythingElse, setUserAnythingElse] = useState("");
  const [userSearchParameters, setUserSearchParameters] = useState<string>("Default");
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);

  const router = useRouter();

  const { data: session } = useSession();

  const setSessionState = async (user: any) => {
    if (user) {
      if (user.id !== -99) {
        const response = await fetch(`/api/get-query-counts?userId=${user.id}`);
        if (response.ok) {
          const { queriesMade, queriesAllowed } = await response.json();
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
      }
    }
  };

  useEffect(() => {
    if (session && session.user) {
      setSessionState(session.user);
    }
  }, [session]);

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
    setUserProfile((prevProfile) => ({
      ...prevProfile,
      ageGroup: USER_AGE || prevProfile.ageGroup,
      sex: USER_SEX || prevProfile.sex,
      fitnessLevel: USER_FITNESS_LEVEL || prevProfile.fitnessLevel,
      anythingElse: USER_ADDITIONAL_INFO || prevProfile.anythingElse,
    }));

    setUserAuthorized(getUserAuthorization());

    inputRef.current?.focus();
  }, []);

  // Save session with the latest values when the user leaves the tab
  useEffect(() => {
    const saveSession = () => {
      if (userId == -99 && session) {
        sessionStorage.setItem(
          "session",
          JSON.stringify({ ...session, user: { ...session.user, queriesAllowed: freeQueries, queriesMade: queryCount } })
        );
      }
    };
    saveSession();
  }, [freeQueries, queryCount, session, userId]);

  const getUserAuthorization = () => {
    if (queryCount < freeQueries) {
      return true;
    } else if (apiKey && apiKey.length == 51) {
      return true;
    }
    return false;
  };

  interface QueryInfoBoxProps {
    apiKey: string;
    queriesMade: number;
    queriesAllowed: number;
  }

  const QueryInfoBox: React.FC<QueryInfoBoxProps> = ({ apiKey, queriesMade, queriesAllowed }) => {
    const limitReachedColor = queriesMade >= queriesAllowed && !apiKey ? "bg-red-500 text-white" : "bg-green-500 text-white";
    return (
      <div className={`mt-2 flex items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm ${limitReachedColor}`}>
        {apiKey && apiKey.length == 51 ? "API Authenticated" : `${queriesMade} / ${queriesAllowed} Queries`}
      </div>
    );
  };

  // Render page
  return (
    <>
      <Head>
        <title>HuberGPT</title>
        <meta name="description" content={`AI-powered search and chat for the Huberman Lab podcast. `} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/hubermanlabicon.jpeg" />
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
              userProfile={userProfile}
              setUserProfile={setUserProfile}
            />
            {getUserAuthorization() ? (
              <Search
                apiKey={apiKey}
                userId={userId}
                queryCount={queryCount}
                setQueryCount={setQueryCount}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                setAnswer={setAnswer}
                setChunks={setChunks}
                setLoading={setLoading}
              />
            ) : (
              <div className="text-center font-bold text-3xl mt-7">
                Kindly authenticate using Login or OpenAI API Key in{" "}
                <a className="underline hover:opacity-50" onClick={() => setShowSettings(true)}>
                  Settings
                </a>{" "}
              </div>
            )}
            <QueryInfoBox apiKey={apiKey} queriesAllowed={freeQueries} queriesMade={queryCount} />

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
                <Chunks chunks={chunks} />
              </div>
            ) : chunks.length > 0 ? (
              <Chunks chunks={chunks} />
            ) : (
              <div>
                <div className="mt-6 text-center text-lg">{`AI-powered search and chat for the Huberman Lab podcast.`}</div>
                <div className="mt-2 text-center text-lg">{`Your personal data is only saved on your local device.`}</div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  return {
    props: {
      session,
    },
  };
}
