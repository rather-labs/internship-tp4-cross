"use client";

import { useAccount, useConnect } from "wagmi";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "@/components/Tooltip";
import { Header } from "@/components/Header";
import { useGame } from "@/contexts/GameContext";
import { useChainData } from "@/contexts/ChainDataContext";

function App() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const router = useRouter();
  const { restartGame } = useGame();
  const { dispatch } = useChainData();

  const metamaskConnector = connectors.find(
    (connector) => connector.name === "MetaMask"
  ) as (typeof connectors)[number];

  const renderGameButton = () => {
    return (
      <div className="space-y-4 mt-8">
        <div className="ml-6 flex items-center justify-center gap-2">
          <button
            className="bg-[#F6851B] hover:bg-[#E2761B] text-white px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
            onClick={() => router.push("/game/single-player")}
          >
            Start Game
          </button>
          <Tooltip
            content="You will play taking both your turn and the other player's turn, simulating a two-player game. You can also use this for local play with a friend!"
            link={{
              href: "https://docs.axelar.dev/",
              text: "Learn More",
            }}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    restartGame();
    dispatch({ type: "RESET" }); // clears chain data
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#24272A]">
      <Toaster />
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-5xl font-bold mb-6">
            Play Rock-Paper-Scissors
            <br />
            <span className="text-[#037DD6]">Across Blockchains</span>
          </h2>
          <>
            <p className="text-xl text-[#6A737D] max-w-2xl mx-auto text-justify">
              This game app is a proof of concept for R-Cross, a cross-chain
              communication protocol developed by Rather Labs Innovation
              Department. <br />
              This protocol can be used to send arbitrary data across two
              different blockchains, utilizing a proof of inclusion strategy to
              assure the authenticity and integrity of the message. Here we use
              it to play rock-paper-scissor across blockchains.
            </p>
            <a href={"kk"} className="text-[#037DD6] hover:text-[#0260A4]">
              Learn More
            </a>
          </>
          {account.status === ("connected" as const) ? (
            renderGameButton()
          ) : (
            <div className="space-y-4 mt-8">
              <button
                className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => connect({ connector: metamaskConnector })}
                disabled={!metamaskConnector}
              >
                Connect Wallet to Play
              </button>
              <p className="text-[#BBC0C5]">
                Connect your wallet to start playing
              </p>
            </div>
          )}
        </div>

        {/* Game Features */}
        <section className="grid md:grid-cols-1 gap-40">
          {[
            {
              title: "Cross-Chain Protocol and Game Article",
              desc: "Learn more about the protocol and game works",
              link: "https://docs.crosschainrps.com",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow  w-fit mx-auto"
            >
              <div className="text-4xl mb-4">{i === 0 ? "⛓️" : "✂️"}</div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-[#6A737D]">{feature.desc}</p>
              <a
                href={feature.link}
                className="text-[#037DD6] hover:text-[#0260A4] transition-colors"
              >
                Learn More
              </a>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;
