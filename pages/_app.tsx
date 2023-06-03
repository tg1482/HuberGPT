import "@/styles/globals.css";
import { Inter } from "@next/font/google";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

interface MyPageProps extends AppProps {
  pageProps: {
    session?: Session;
  };
}

const inter = Inter({ subsets: ["latin"] });

const defaultSession = {
  user: {
    id: -99,
    email: null,
    queriesAllowed: 2,
    queriesMade: 0,
  },
  expires: new Date().toISOString(),
};

export default function App({ Component, pageProps }: MyPageProps) {
  return (
    <SessionProvider session={pageProps.session ? pageProps.session : defaultSession}>
      <main className={inter.className}>
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
}
