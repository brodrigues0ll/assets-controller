import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import favicon from "../../public/favicon.ico";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "InfraLedger",
  description: "Sistema Web de Controle de Inventário",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      {/* favicon */}
      <link rel="icon" href={favicon.src} />
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
