import { Suspense } from "react";
import ExploreContent from "./explore-content";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
