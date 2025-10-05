import type { LineString } from 'geojson';
import { createContext, useState, useContext, type PropsWithChildren } from 'react';
import type { PatternSearchRunResponse } from '../types/patternSearch';

type ActiveDatasetInfo = {
  datasetId: string;
  datasetName?: string | null;
  datasetFileId?: string | null;
  datasetFileName?: string | null;
};

type MapSidebarContextValue = {
  isOpened: boolean;
  toggleOpened: () => void;
  setOpened: (value: boolean) => void;
  activeLineString: LineString | null;
  setActiveLineString: (value: LineString | null) => void;
  currentDataset: ActiveDatasetInfo | null;
  setCurrentDataset: (value: ActiveDatasetInfo | null) => void;
  lastSearchResult: PatternSearchRunResponse | null;
  setLastSearchResult: (value: PatternSearchRunResponse | null) => void;
};

const defaultContext: MapSidebarContextValue = {
  isOpened: false,
  toggleOpened: () => undefined,
  setOpened: () => undefined,
  activeLineString: null,
  setActiveLineString: () => undefined,
  currentDataset: null,
  setCurrentDataset: () => undefined,
  lastSearchResult: null,
  setLastSearchResult: () => undefined,
};

const MapSidebarContext = createContext<MapSidebarContextValue>(defaultContext);

export const MapSidebarProvider = ({ children }: PropsWithChildren) => {
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [activeLineString, setActiveLineString] = useState<LineString | null>(null);
  const [currentDataset, setCurrentDataset] = useState<ActiveDatasetInfo | null>(null);
  const [lastSearchResult, setLastSearchResult] = useState<PatternSearchRunResponse | null>(null);

  const toggleOpened = () => {
    setIsOpened((prev) => !prev);
  };

  const setOpened = (value: boolean) => {
    setIsOpened(value);
  };

  const contextValue: MapSidebarContextValue = {
    isOpened,
    toggleOpened,
    setOpened,
    activeLineString,
    setActiveLineString,
    currentDataset,
    setCurrentDataset,
    lastSearchResult,
    setLastSearchResult,
  };

  return (
    <MapSidebarContext.Provider value={contextValue}>
      {children}
    </MapSidebarContext.Provider>
  );
};

export const useMapSidebar = (): MapSidebarContextValue => {
  return useContext(MapSidebarContext);
};
