import { WalletConnection } from "./WalletConnection";

export function Header() {
  return (
    <header className="p-6 flex justify-between items-center bg-white shadow-md">
      <h1 className="text-2xl font-bold text-[#24272A] flex items-center gap-2">
        <a href="/">
          <img src="/rps-icon.webp" alt="RPS Game Icon" className="w-14 h-14" />
        </a>
        Cross-Chain RPS
      </h1>
      <WalletConnection />
    </header>
  );
}
