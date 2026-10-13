import Link from "next/link";
import { Compass, ArrowUpRight } from "lucide-react";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="NeoQuest home"
    >
      <span className="brand-icon">
        <Compass size={23} strokeWidth={1.8} />
      </span>
      neoquest<span className="brand-dot">.</span>
    </Link>
  );
}
export function Header() {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="Main navigation">
        <span className="prototype-tag">FIRST PROTOTYPE</span>
        <Link href="/map" className="button dark small">
          Explore the map <ArrowUpRight size={16} />
        </Link>
      </nav>
    </header>
  );
}
