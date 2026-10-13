export type Category = "food" | "sports" | "outdoors" | "cafe";
export type Activity = {
  id: string;
  name: string;
  category: Category;
  description: string;
  area: string;
  position: [number, number];
};

export const BERKELEY_CENTER: [number, number] = [37.8716, -122.2727];
export const categories: {
  id: Category;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { id: "food", label: "Food", emoji: "🍜", color: "#ecc6a5" },
  { id: "sports", label: "Sports", emoji: "🏀", color: "#b7d0df" },
  { id: "outdoors", label: "Outdoors", emoji: "🌿", color: "#bdd4a8" },
  { id: "cafe", label: "Cafés", emoji: "☕", color: "#d6c2df" },
];

// Fictional activities near real Berkeley neighborhoods, not verified businesses.
// Coordinates are illustrative starting points, not exact venue entrances.
export const sampleActivities: Activity[] = [
  {
    id: "boba",
    name: "Boba & a little catch-up",
    category: "cafe",
    description:
      "Try a new milk-tea flavor and catch up with your friends. An idea for a relaxed afternoon tea stop.",
    area: "Downtown Berkeley",
    position: [37.873, -122.2698],
  },
  {
    id: "picnic",
    name: "Cedar Street picnic",
    category: "outdoors",
    description:
      "Pack a blanket, sandwiches, and a card game for a casual neighborhood picnic. Scout a suitable public spot first.",
    area: "North Berkeley",
    position: [37.8805, -122.2755],
  },
  {
    id: "coffee",
    name: "Coffee & a study session",
    category: "cafe",
    description:
      "Find a cozy café corner for coffee, conversation, or a shared study session. A sample café hangout idea.",
    area: "University Avenue",
    position: [37.872, -122.278],
  },
  {
    id: "hoops",
    name: "Golden-hour hoops",
    category: "sports",
    description:
      "Bring a basketball and your crew for a friendly pickup game. Check local court access before heading out.",
    area: "Central Berkeley",
    position: [37.8664, -122.2704],
  },
  {
    id: "noodles",
    name: "A neighborhood noodle stop",
    category: "food",
    description:
      "Choose a bowl, share a table, and swap stories over comfort food. A fictional food stop near Telegraph.",
    area: "Telegraph Avenue",
    position: [37.8678, -122.259],
  },
  {
    id: "campus",
    name: "Take the scenic campus route",
    category: "outdoors",
    description:
      "Wander the public paths around campus and find a shady bench. A simple idea for fresh air and good conversation.",
    area: "UC Berkeley",
    position: [37.874, -122.255],
  },
  {
    id: "matcha",
    name: "A little matcha moment",
    category: "cafe",
    description:
      "Take a tea break and discover a new favorite drink together. A fictional café activity around Oxford Street.",
    area: "Oxford Street",
    position: [37.8773, -122.2664],
  },
  {
    id: "pizza",
    name: "Share a slice",
    category: "food",
    description:
      "Grab a few slices with friends and turn lunch into a neighborhood stroll. A sample food outing, not a business listing.",
    area: "North Shattuck",
    position: [37.886, -122.2688],
  },
  {
    id: "sunset",
    name: "A hillside sunset stroll",
    category: "outdoors",
    description:
      "Bring water and take a short walk toward the hills for golden-hour views. Check public trail access and conditions first.",
    area: "Berkeley Hills",
    position: [37.881, -122.238],
  },
  {
    id: "rally",
    name: "A friendly weekend rally",
    category: "sports",
    description:
      "Bring a racket and invite a friend for an easy rally. A sample sports idea; court availability is not verified.",
    area: "Near King Park",
    position: [37.8895, -122.279],
  },
  {
    id: "tacos",
    name: "Tacos & a neighborhood walk",
    category: "food",
    description:
      "Pick a casual lunch spot, then explore a few unfamiliar blocks together. A fictional food outing near San Pablo Avenue.",
    area: "West Berkeley",
    position: [37.8693, -122.2905],
  },
  {
    id: "walk",
    name: "A slow morning park walk",
    category: "outdoors",
    description:
      "Stretch your legs and trade weekend stories on an easy neighborhood walk. An illustrative outdoor activity near a public park.",
    area: "Near Ohlone Park",
    position: [37.8754, -122.2787],
  },
];

export function filterActivities(
  activities: Activity[],
  category: Category | "all",
) {
  return category === "all"
    ? activities
    : activities.filter((activity) => activity.category === category);
}
