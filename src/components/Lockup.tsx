// The three partner logos, always shown as supplied (no effects on any of them).
export default function Lockup({ className = "" }: { className?: string }) {
  return (
    <div className={`lockup ${className}`}>
      <img src="/brand/manara-light.webp" alt="Manara West" className="lockup-manara" />
      <span className="lockup-x">×</span>
      <img src="/brand/replit-lockup-pill.svg" alt="Replit" className="lockup-replit" />
      <span className="lockup-x">×</span>
      <img src="/brand/mtc.png" alt="Muslim Tech Collaborative at UCSD" className="lockup-mtc" />
    </div>
  );
}
