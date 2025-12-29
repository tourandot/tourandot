// Shared types between API and mobile app

export interface Tour {
  id: string;
  title: string;
  description: string;
  duration: string;
  stops: number;
  distance: string;
  coverImage: string | null;
}

export interface TourStop {
  id: string;
  order: number;
  title: string;
  description: string;
  lat: number;
  lng: number;
  audioUrl?: string;
}

export interface TourDetails extends Omit<Tour, "stops"> {
  stops: TourStop[];
  route: {
    coordinates: [number, number][];
  };
}

export interface PartyMember {
  id: string;
  name: string;
  ready: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Party {
  code: string;
  tourId: string;
  hostId: string;
  config: PartyConfig;
  members: PartyMember[];
  status: "lobby" | "active" | "completed";
  currentStop: number;
}

export interface PartyConfig {
  narrationStyle: "verbose" | "quick" | "balanced";
}

// WebSocket message types
export type WSMessage =
  | { type: "location"; userId: string; location: { lat: number; lng: number } }
  | { type: "start"; userId: string }
  | { type: "advance"; userId: string }
  | { type: "play"; stopIndex: number; audioUrl: string }
  | { type: "member_joined"; member: PartyMember }
  | { type: "member_ready"; userId: string }
  | { type: "sync"; party: Party };
