"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  LocateFixed,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Brand } from "./brand";
import {
  categories,
  filterActivities,
  sampleActivities,
  type Category,
} from "@/lib/activities";

const ActivityMap = dynamic(() => import("./activity-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      <Compass size={28} />
      <span>Opening your little corner of Berkeley…</span>
    </div>
  ),
});

export function Explorer() {
  const [category, setCategory] = useState<Category | "all">("all");
  const [selection, setSelection] = useState<{ id: string } | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const activities = filterActivities(sampleActivities, category);
  const onSelect = useCallback((id: string) => setSelection({ id }), []);
  function chooseCategory(next: Category | "all") {
    setCategory(next);
    setSelection(null);
  }

  return (
    <div className="explorer">
      <header className="explorer-header">
        <Brand />
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Back home
        </Link>
        <span className="prototype-tag">FIRST PROTOTYPE</span>
      </header>
      <main>
        <section className="explorer-intro">
          <div>
            <span className="eyebrow">
              A LITTLE SPONTANEITY GOES A LONG WAY
            </span>
            <h1>
              Your kind of nearby<span>✳</span>
            </h1>
            <p>Find a place to start. Bring your favorite people.</p>
          </div>
          <div className="berkeley-badge">
            <MapPin size={17} />
            <div>
              <strong>Berkeley, California</strong>
              <span>12 sample ideas. Endless possibilities.</span>
            </div>
          </div>
        </section>
        <div className="sample-notice">
          <Sparkles size={16} />
          <p>
            <strong>You’re exploring a prototype.</strong> All activities are
            fictional sample ideas with illustrative locations, not verified
            businesses or recommendations.
          </p>
        </div>
        <div className="explorer-workspace">
          <aside
            className="activity-sidebar"
            aria-label="Activity list and category filters"
          >
            <div className="sidebar-heading">
              <h2>What’s the vibe?</h2>
              <p>A quest for every kind of day.</p>
            </div>
            <div
              className="category-filters"
              aria-label="Filter activities by category"
            >
              <button
                onClick={() => chooseCategory("all")}
                aria-pressed={category === "all"}
                className={category === "all" ? "active" : ""}
              >
                ✦ All ideas
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => chooseCategory(c.id)}
                  aria-pressed={category === c.id}
                  className={category === c.id ? "active" : ""}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="list-heading">
              <h2>A little inspiration</h2>
              <span role="status">{activities.length} activities</span>
            </div>
            <div className="activity-list">
              {activities.map((activity) => {
                const c = categories.find((c) => c.id === activity.category)!;
                return (
                  <button
                    key={activity.id}
                    className={`activity-card ${selection?.id === activity.id ? "selected" : ""}`}
                    onClick={() => onSelect(activity.id)}
                    aria-pressed={selection?.id === activity.id}
                  >
                    <span
                      className="activity-art"
                      style={{ background: c.color }}
                    >
                      {c.emoji}
                    </span>
                    <span className="activity-copy">
                      <span className="activity-category">
                        {c.label} · Sample
                      </span>
                      <strong>{activity.name}</strong>
                      <span className="activity-area">
                        <MapPin size={10} />
                        {activity.area}
                      </span>
                    </span>
                    <ArrowUpRight size={16} className="card-arrow" />
                  </button>
                );
              })}
            </div>
            <p className="sidebar-note">
              Pick an idea to see it on the map. This prototype has no bookings,
              live place search, or account setup.
            </p>
          </aside>
          <section className="map-pane" aria-label="Interactive map">
            <ActivityMap
              activities={activities}
              selection={selection}
              onSelect={onSelect}
              resetKey={resetKey}
            />
            <button
              className="recenter-button"
              onClick={() => {
                setSelection(null);
                setResetKey((k) => k + 1);
              }}
              aria-label="Recenter on Berkeley"
            >
              <LocateFixed size={17} />
              <span>Back to Berkeley</span>
            </button>
            <div className="map-hint">
              <Compass size={18} />
              <span>Pick a pin. Find a little possibility.</span>
            </div>
          </section>
        </div>
      </main>
      <footer className="explorer-footer">
        <span>A little adventure. A lot of possibility.</span>
        <span>Sample data · No API keys needed</span>
      </footer>
    </div>
  );
}
