import "./globals.css";
import dynamic from "next/dynamic";
import Oracle from "@/components/Oracle";
import Relayer from "@/components/Relayer";

const Providers = dynamic(
  () => import("./Providers").then((mod) => mod.Providers),
  { ssr: false }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Oracle />
          <Relayer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
