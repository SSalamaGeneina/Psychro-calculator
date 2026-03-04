import { create } from 'zustand';

export interface ZoneInput {
  temp: number;
  rh: number;
}

export interface AppState {
  airPressure: number;
  zones: {
    outside: ZoneInput;
    aboveScreen: ZoneInput;
    inside: ZoneInput;
    plant: ZoneInput;
  };
  energyBalance: {
    solarRadiation: number;
    radiationInside: number;
    uValue: number;
  };
  moistureBalance: {
    cropEvaporation: number;
    foggingRate: number;
  };
  moistureControl: {
    greenhouseArea: number;
    capacity: number;
    pressureDiff: number;
    efficiency: number;
    cropTemp: number;
    cropRH: number;
    cropHeight: number;
  };
  ui: {
    showExtra: boolean;
    showChart: boolean;
    moreInfo: boolean;
    activeTab: number;
  };
}

interface AppActions {
  setAirPressure: (value: number) => void;
  setZoneTemp: (zone: keyof AppState['zones'], value: number) => void;
  setZoneRH: (zone: keyof AppState['zones'], value: number) => void;
  setEnergyBalance: (field: keyof AppState['energyBalance'], value: number) => void;
  setMoistureBalance: (field: keyof AppState['moistureBalance'], value: number) => void;
  setMoistureControl: (field: keyof AppState['moistureControl'], value: number) => void;
  toggleShowExtra: () => void;
  toggleShowChart: () => void;
  toggleMoreInfo: () => void;
  setActiveTab: (tab: number) => void;
  setOutsideFromWeather: (temp: number, rh: number) => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  airPressure: 1013,
  zones: {
    outside: { temp: 18, rh: 70 },
    aboveScreen: { temp: 19, rh: 78 },
    inside: { temp: 20, rh: 85 },
    plant: { temp: 22, rh: 100 },
  },
  energyBalance: {
    solarRadiation: 500,
    radiationInside: 70,
    uValue: 7,
  },
  moistureBalance: {
    cropEvaporation: 50,
    foggingRate: 0,
  },
  moistureControl: {
    greenhouseArea: 160,
    capacity: 5,
    pressureDiff: 150,
    efficiency: 30,
    cropTemp: 20,
    cropRH: 95,
    cropHeight: 1,
  },
  ui: {
    showExtra: false,
    showChart: true,
    moreInfo: false,
    activeTab: 0,
  },

  setAirPressure: (value) => set({ airPressure: Math.min(1250, Math.max(500, value)) }),

  setZoneTemp: (zone, value) =>
    set((state) => ({
      zones: {
        ...state.zones,
        [zone]: { ...state.zones[zone], temp: Math.min(50, Math.max(-20, value)) },
      },
    })),

  setZoneRH: (zone, value) =>
    set((state) => ({
      zones: {
        ...state.zones,
        [zone]: { ...state.zones[zone], rh: Math.min(100, Math.max(0, value)) },
      },
    })),

  setEnergyBalance: (field, value) =>
    set((state) => ({
      energyBalance: { ...state.energyBalance, [field]: value },
    })),

  setMoistureBalance: (field, value) =>
    set((state) => ({
      moistureBalance: { ...state.moistureBalance, [field]: value },
    })),

  setMoistureControl: (field, value) =>
    set((state) => ({
      moistureControl: { ...state.moistureControl, [field]: value },
    })),

  toggleShowExtra: () =>
    set((state) => ({ ui: { ...state.ui, showExtra: !state.ui.showExtra } })),

  toggleShowChart: () =>
    set((state) => ({ ui: { ...state.ui, showChart: !state.ui.showChart } })),

  toggleMoreInfo: () =>
    set((state) => ({ ui: { ...state.ui, moreInfo: !state.ui.moreInfo } })),

  setActiveTab: (tab) =>
    set((state) => ({ ui: { ...state.ui, activeTab: tab } })),

  setOutsideFromWeather: (temp, rh) =>
    set((state) => ({
      zones: {
        ...state.zones,
        outside: { temp, rh },
      },
    })),
}));
