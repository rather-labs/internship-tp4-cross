import { Routes, Route } from "react-router-dom";
import { Providers } from "./contexts/Providers";
// Import your components/pages here
import Oracle from "./components/Oracle";
import Relayer from "./components/Relayer";
import Home from "./pages/home";
import SinglePlayerGame from "./pages/single-player";

function App() {
  return (
    <Providers>
      <Oracle />
      <Relayer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/single-player" element={<SinglePlayerGame />} />
        {/* Add a 404 route */}
        <Route path="*" element={<div>404 - Page not found</div>} />
      </Routes>
    </Providers>
  );
}

export default App;
