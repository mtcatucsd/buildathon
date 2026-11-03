import GradientASCII from "./GradientASCII";

// The dead city: a dim ASCII field glowing along the horizon (React Bits GradientASCII).
export default function StaticCity({ interactive = true }: { interactive?: boolean }) {
  return (
    <div className="static-city" aria-hidden="true">
      <GradientASCII
        colors={["#191818", "#2a0f06", "#FF3C00", "#EFC25B"]}
        shape="rise"
        cellSize={13}
        glyphOpacity={0.55}
        gradientOpacity={0.5}
        glow={0.6}
        flicker={0.35}
        speed={0.4}
        grain={0.12}
        intro={interactive}
        mouseInteraction={interactive}
        clickEffect={interactive ? "wave" : "none"}
        fontFamily='"Diatype Semi-Mono", ui-monospace, monospace'
      />
      <div className="vignette" />
    </div>
  );
}
