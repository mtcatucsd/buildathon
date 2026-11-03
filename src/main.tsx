import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { freezeBeam } from "./components/beamClock";
import { startSmoothScroll } from "./story/smoothScroll";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/amiri/arabic-700.css";

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) freezeBeam(0);

if (!location.search.includes("flyer")) startSmoothScroll();

// No StrictMode: the React Bits WebGL components lose their context on the dev-only double mount.
createRoot(document.getElementById("root")!).render(<App />);
