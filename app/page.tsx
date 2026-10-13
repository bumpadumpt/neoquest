import Link from "next/link";
import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { Header, Brand } from "@/components/brand";

export default function Home() {
  return (
    <>
      <Header />
      <main className="home-main">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">LESS SCROLLING. MORE STORIES.</span>
            <h1>
              Your next great
              <br />
              memory is
              <br />
              <em>around the corner.</em>
            </h1>
            <p>
              Less “what should we do?” More “remember when?” Find little
              adventures for your mood and your crew.
            </p>
            <Link href="/map" className="button dark">
              Explore the Berkeley demo <ArrowUpRight size={19} />
            </Link>
            <span className="hero-footnote">
              No account. No API keys. Just a little curiosity.
            </span>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="decorative-grid" />
            <div className="decorative-park" />
            <span className="visual-city">BERKELEY, CA</span>
            <span className="decorative-pin pin-food">🍜</span>
            <span className="decorative-pin pin-coffee">☕</span>
            <span className="decorative-pin pin-sports">🏀</span>
            <span className="decorative-pin pin-park">🌿</span>
            <div className="hero-card">
              <span className="hero-card-art">🧋</span>
              <div>
                <span className="eyebrow">A SAMPLE SIDE QUEST</span>
                <h2>Boba & a little catch-up</h2>
                <p>Something sweet. Somewhere new.</p>
                <span>
                  <MapPin size={12} /> Downtown Berkeley
                </span>
              </div>
            </div>
            <span className="visual-note">take the scenic route.</span>
          </div>
        </section>
        <section className="home-note">
          <Sparkles size={22} />
          <div>
            <h2>A small prototype. A world of possibilities.</h2>
            <p>
              Explore 12 fictional activity ideas around Berkeley. Filter by
              Food, Sports, Outdoors, Cafés, Boba, or Parks, then pick a pin to
              learn more. Optional live discovery finds real nearby places when
              configured.
            </p>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <Brand />
        <span>Made for the moments in between.</span>
        <Link href="/map">Find a little adventure ↗</Link>
      </footer>
    </>
  );
}
