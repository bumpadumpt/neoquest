import { Suspense } from "react";
import { ActivityOptions } from "@/components/activity-options";

export default function ActivityOptionsPage() {
  return <Suspense fallback={<div className="options-page">Opening activity options…</div>}><ActivityOptions liveSupported={process.env.NEOQUEST_GITHUB_PAGES !== "true"} /></Suspense>;
}
