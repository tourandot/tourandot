const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.0.78:3000";

interface Tour {
  id: string;
  title: string;
  description: string;
  duration: string;
  stops: number;
  distance: string;
}

interface TourDetails {
  id: string;
  title: string;
  description: string;
  duration: string;
  stops: Array<{
    id: string;
    order: number;
    title: string;
    description: string;
    lat: number;
    lng: number;
  }>;
  route: {
    coordinates: number[][];
  };
}

interface Party {
  code: string;
  tourId: string;
  hostId: string;
  members: Array<{
    id: string;
    name: string;
    ready: boolean;
  }>;
  status: "lobby" | "active" | "completed";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = { ...options?.headers };

  // Only set Content-Type for requests with a body
  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`API error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

export const api = {
  getTours: () => request<{ tours: Tour[] }>("/tours"),

  getTour: (id: string) => request<{ tour: TourDetails }>(`/tours/${id}`),

  createParty: (data: {
    tourId: string;
    hostId: string;
    hostName: string;
    config: { narrationStyle: "verbose" | "quick" | "balanced" };
    joinMode: "open" | "pin";
    pin?: string;
  }) =>
    request<{ code: string; party: Party }>("/party", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getParty: (code: string) => request<{ party: Party }>(`/party/${code}`),

  joinParty: (code: string, userId: string, name: string) =>
    request<{ party: Party }>(`/party/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ userId, name }),
    }),

  markReady: (code: string, userId: string) =>
    request<{ ready: boolean; allReady: boolean }>(`/party/${code}/ready`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  getOngoingParties: () =>
    request<{
      parties: Array<{
        code: string;
        tourId: string;
        joinMode: "open" | "pin";
        memberCount: number;
        createdAt: string;
      }>;
    }>("/party/ongoing"),

  joinPartyWithPin: (code: string, userId: string, name: string, pin?: string) =>
    request<{ party: Party }>(`/party/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ userId, name, pin }),
    }),

  endParty: (code: string) =>
    request<{ success: boolean }>(`/party/${code}`, {
      method: "DELETE",
    }),
};
