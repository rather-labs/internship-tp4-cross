import "./globals.css";
import dynamic from "next/dynamic";
import OracleAndRelayer from "@/components/OracleAndRelayer";

const Providers = dynamic(
  () => import("./providers").then((mod) => mod.Providers),
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
          <OracleAndRelayer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
