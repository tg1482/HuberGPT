import "@/styles/globals.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
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

const expiryDate = new Date();
expiryDate.setHours(expiryDate.getHours() + 2);

const defaultSession = {
  user: {
    id: -99,
    email: null,
    queriesAllowed: 2,
    queriesMade: 0,
  },
  // expire in 4 hours
  expires: expiryDate.toISOString(),
};

export default function App({ Component, pageProps }: MyPageProps) {
  const validSession = pageProps.session?.user?.name && pageProps.session?.expires;
  const session = validSession ? pageProps.session : defaultSession;
  return (
    <SessionProvider session={session}>
      <main className={inter.className}>
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
}
