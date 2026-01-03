import AsyncStorage from "@react-native-async-storage/async-storage";

const ACTIVE_TOUR_KEY = "@tourandot/active-tour";

export interface ActiveTourState {
  code: string;
  tourId: string;
  isHost: boolean;
  pin?: string;
  startedAt: string;
}

export const activeTour = {
  async get(): Promise<ActiveTourState | null> {
    try {
      const data = await AsyncStorage.getItem(ACTIVE_TOUR_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(state: ActiveTourState): Promise<void> {
    await AsyncStorage.setItem(ACTIVE_TOUR_KEY, JSON.stringify(state));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(ACTIVE_TOUR_KEY);
  },

  async isActive(): Promise<boolean> {
    const state = await this.get();
    return state !== null;
  },
};
