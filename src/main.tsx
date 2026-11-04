import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { startSmoothScroll } from "./story/smoothScroll";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/amiri/arabic-700.css";

if (!location.search.includes("flyer")) {
  startSmoothScroll(); // laptops: Lenis. Phones keep native momentum scrolling (see Chapter's PHONE_LENGTH).
}

// No StrictMode: the React Bits WebGL components lose their context on the dev-only double mount.
createRoot(document.getElementById("root")!).render(<App />);