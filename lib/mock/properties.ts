// Mock Numa world: properties, rooms, nearby spots, extras, FAQs.
// All faked — this is a prototype to communicate the ideas.

export const IMG = {
  roomBerlin:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80&auto=format&fit=crop",
  roomPink:
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80&auto=format&fit=crop",
  roomBarcelona:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80&auto=format&fit=crop",
  propBerlin:
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80&auto=format&fit=crop",
  propBarcelona:
    "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=900&q=80&auto=format&fit=crop",
  propLondon:
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&q=80&auto=format&fit=crop",
  propAmsterdam:
    "https://images.unsplash.com/photo-1558551649-e44c8f992010?w=900&q=80&auto=format&fit=crop",
  ramen:
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80&auto=format&fit=crop",
  coffee:
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&q=80&auto=format&fit=crop",
  breakfast:
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80&auto=format&fit=crop",
  acVideo:
    "https://images.unsplash.com/photo-1631545806609-c2b999c5b3e4?w=900&q=80&auto=format&fit=crop",
  hero: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80&auto=format&fit=crop",
};

export interface MockProperty {
  id: string;
  name: string;
  city: string;
  location: string;
  image: string;
  priceFrom: string;
  amenities: string[];
}

export const PROPERTIES: MockProperty[] = [
  {
    id: "berlin-novela",
    name: "Numa Berlin Novela",
    city: "Berlin",
    location: "Großbeerenstraße, Kreuzberg",
    image: IMG.propBerlin,
    priceFrom: "€129 / night",
    amenities: ["Self check-in", "Fast Wi-Fi", "Kitchenette", "Workspace"],
  },
  {
    id: "barcelona-palmera",
    name: "Numa Barcelona Palmera",
    city: "Barcelona",
    location: "El Born, Ciutat Vella",
    image: IMG.propBarcelona,
    priceFrom: "€142 / night",
    amenities: ["Rooftop", "Self check-in", "Fast Wi-Fi", "Family rooms"],
  },
  {
    id: "london-chelsea",
    name: "Numa London Chelsea Green",
    city: "London",
    location: "Chelsea, SW3",
    image: IMG.propLondon,
    priceFrom: "£164 / night",
    amenities: ["Boutique cafés nearby", "Self check-in", "Workspace"],
  },
];

// Nearby points of interest around Numa Berlin Novela.
export const BERLIN_POIS = [
  { name: "Cocolo Ramen", type: "Ramen", rating: 4.6, walk: "8 min walk", image: IMG.ramen },
  { name: "Takumi Nine", type: "Ramen", rating: 4.4, walk: "12 min walk", image: IMG.ramen },
  { name: "Bonanza Coffee", type: "Coffee shop", rating: 4.3, walk: "6 min walk", image: IMG.coffee },
  { name: "Companion Coffee", type: "Coffee shop", rating: 4.5, walk: "10 min walk", image: IMG.coffee },
];

// Orderable extras for the current stay.
export const EXTRAS = [
  {
    title: "Breakfast at Ehrlich Grün",
    subtitle: "Healthy eats, specialty coffee",
    meta: "€12 per person",
    emoji: "🥐",
    image: IMG.breakfast,
    action: "Add",
  },
  {
    title: "Room upgrade",
    subtitle: "More space, more comfort",
    meta: "From €18 / night",
    emoji: "🛏️",
    action: "Request",
  },
  {
    title: "Late checkout",
    subtitle: "Stay until 2pm",
    meta: "€25",
    emoji: "🕑",
    action: "Add",
  },
];

// Common FAQs that Lumi can surface as a list.
export const FAQS = [
  { title: "What time is check-in?", subtitle: "From 3:00 PM", emoji: "🔑" },
  { title: "How do I access my room?", subtitle: "Pinless entry via the app", emoji: "🚪" },
  { title: "Is there parking?", subtitle: "Street parking + nearby garage", emoji: "🅿️" },
  { title: "Where's my luggage stored?", subtitle: "Self-service storage on-site", emoji: "🧳" },
];
