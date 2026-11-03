import "./App.css";
import "./story/story.css";
import Spotlight from "./components/Spotlight";
import TopBar from "./story/TopBar";
import ChapterRail from "./story/ChapterRail";
import Prologue from "./screens/Prologue";
import TheNoise from "./screens/TheNoise";
import TheSignal from "./screens/TheSignal";
import TrackChapter from "./screens/TrackChapter";
import BeyondTheBubble from "./screens/BeyondTheBubble";
import TheDay from "./screens/TheDay";
import TheReward from "./screens/TheReward";
import Epilogue from "./screens/Epilogue";
import Flyer, { type FlyerFormat } from "./flyer/Flyer";
import { trackChapters } from "./data/story";

function App() {
  const flyer = new URLSearchParams(location.search).get("flyer");
  if (flyer === "post" || flyer === "story") return <Flyer format={flyer as FlyerFormat} />;

  return (
    <>
      <TopBar />
      <ChapterRail />
      <Spotlight />
      <main>
        <Prologue />
        <TheNoise />
        <TheSignal />
        {trackChapters.map((t) => (
          <TrackChapter key={t.id} track={t} />
        ))}
        <BeyondTheBubble />
        <TheDay />
        <TheReward />
        <Epilogue />
      </main>
    </>
  );
}

export default App;
