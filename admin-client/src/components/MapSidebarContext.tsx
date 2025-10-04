import React, { createContext, useState, useContext } from 'react';

// 1. Context létrehozása.
// Az alapértelmezett értékeket adjuk meg: az állapotot és a frissítő funkciókat.
const MapSidebarContext = createContext({
  isOpened: false,
  toggleOpened: () => {},
  setOpened: (value:boolean) => {},
});

// 2. Provider Komponens
// Ez tartja az állapotot és adja át az értékeket a fának.
export const MapSidebarProvider = ({ children }:any) => {
  const [isOpened, setIsOpened] = useState<boolean>(false);

  // Az állapot átkapcsolása (true <-> false)
  const toggleOpened = () => {
    setIsOpened(prev => !prev);
  };
  
  // A teljes állapot beállítása (pl. setOpened(true) vagy setOpened(false))
  const setOpened = (value:boolean) => {
    setIsOpened(value);
  };

  // Az érték, amit a Context-en keresztül elérhetővé teszünk
  const contextValue = {
    isOpened,
    toggleOpened,
    setOpened,
  };

  return (
    <MapSidebarContext.Provider value={contextValue}>
      {children}
    </MapSidebarContext.Provider>
  );
};

// 3. Egyedi Hook a kényelmes használathoz
// Ezzel lehet hozzáférni a context értékekhez a komponensekben.
export const useMapSidebar = () => {
  return useContext(MapSidebarContext);
};