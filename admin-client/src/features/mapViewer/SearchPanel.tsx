import axios from "axios";
import { ProgressSpinner } from "primereact/progressspinner";
import { VirtualScroller } from "primereact/virtualscroller";
import { useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash/debounce";
import { Avatar } from "primereact/avatar";

type PolygonFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: any;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: PolygonFeature[];
};

type SearchPanelProps = {
  onPolygonsLoaded?: (featureCollection: FeatureCollection | null) => void;
};

const mapPolygonsToFeatureCollection = (polygons: any[]): FeatureCollection => ({
  type: "FeatureCollection",
  features: polygons.map((polygon: any) => ({
    type: "Feature",
    properties: {
      id: polygon.id,
      label: polygon.label,
      creatorUserId: polygon.creatorUserId,
      creatorUserName: polygon.creatorUserName,
    },
    geometry: polygon.geom,
  })),
});

export const SearchPanel = ({ onPolygonsLoaded }: SearchPanelProps) => {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  const [, setSearchParams] = useSearchParams();
  const fallbackThumbnail = "https://media.istockphoto.com/id/1198684732/photo/stars-and-galaxy-space-sky-night-background.jpg?s=612x612&w=0&k=20&c=U6AnXKYJpi9H2tCeGGXSAS_ctR4pgsC-yC07J5ECH5M=";
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await axios.get(
          `http://localhost:3000/api/datasets/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { signal: controller.signal }
        );

        const searchResults = response.data || [];
        setResults(searchResults);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Search error:", error);
          setResults([]);
        }
      } finally {
        setIsSearching(false);
        abortControllerRef.current = null;
      }
    }, 300),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsSearching(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const fetchDatasetFile = async (item: any) => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/datasets/getDatasetFile/" + item.id
      );
      const file = response.data?.file;

      if (!file) {
        console.warn("Dataset file not found for dataset:", item.id);
        return;
      }

      const newParams: Record<string, string> = {
        datasetId: String(item.id),
      };

      if (item.name || item.displayName) {
        newParams.name = item.name || item.displayName;
      }
      if (file.tilesetKey) {
        newParams.tilesKey = file.tilesetKey;
      }
      if (file.centerLat != null) {
        newParams.lat = file.centerLat.toString();
      }
      if (file.centerLng != null) {
        newParams.lng = file.centerLng.toString();
      }

      setSearchParams(newParams, { replace: true });

      if (onPolygonsLoaded) {
        onPolygonsLoaded(null);
      }

      if (file.tilesetKey && onPolygonsLoaded) {
        try {
          const polygonResponse = await axios.get(
            `http://localhost:3000/api/polygon?tileKey=${encodeURIComponent(file.tilesetKey)}`
          );
          const polygonRecords = polygonResponse.data?.polygons ?? [];
          const featureCollection = mapPolygonsToFeatureCollection(polygonRecords);
          onPolygonsLoaded(featureCollection);
        } catch (polygonError) {
          console.error("Polygon fetch error:", polygonError);
          onPolygonsLoaded(null);
        }
      }
    } catch (error) {
      console.error("Dataset file fetch error:", error);
      onPolygonsLoaded?.(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="h-[40px]  border-[1px] border-gray-100/10 w-[600px] cursor-pointer rounded-full flex items-center px-4 gap-2 bg-white/10 backdrop-blur-lg hover:bg-white/20">
          <i className="pi pi-search" />
          <input
            value={query}
            placeholder="Search..."
            className="w-full focus:outline-none"
            onChange={handleSearch}
          />
          {query.length !== 0 ? (
            <i
              className="pi pi-times cursor-pointer"
              onClick={clearSearch}
            />
          ) : null}
        </div>

        <div
          className={`${query.trim() === ''
            ? "h-0"
            : isSearching
              ? "h-[50px]"
              : results.length === 0
                ? "h-auto min-h-[100px]"
                : "h-[500px]"
            } w-[600px]  transition-all duration-300 ease-in-out bg-white/10 backdrop-blur-lg rounded-3xl flex flex-col items-center justify-center overflow-hidden`}
        >
          {isSearching ? (
            <ProgressSpinner style={{ width: 32, height: 32 }} />
          ) : null}

          {query.trim() !== '' && !isSearching && results.length === 0 ? (
            <div className="text-white text-center">
              <p className="text-lg">No results.</p>
              <p className="text-sm opacity-75">Try another query</p>
            </div>
          ) : null}

          {query.trim() !== '' && !isSearching && results.length > 0 ? (
            <VirtualScroller
              className="h-full w-full"
              items={results}
              itemSize={50}
              itemTemplate={(item, options) => (
                <div
                  key={item.id || options.index}
                  className="p-2 mx-4 mt-4 flex items-start gap-4 hover:bg-white/20 rounded-lg cursor-pointer"
                  onClick={() => fetchDatasetFile(item)}
                >
                  <img
                    width={80}
                    className="rounded-lg shadow-lg"
                    src={item.previewImageUrl || item.thumbnailUrl || fallbackThumbnail}
                    alt={item.name}
                  />
                  <div>
                    <div className="text-lg font-semibold text-white">{item.name || item.displayName}</div>
                    <div className="text-sm text-white/80">{item.description || 'Nincs leiras'}</div>
                    <div className="text-sm text-white/80">Created: {new Date(item.createdAt).toISOString()}</div>
                  </div>
                </div>
              )}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};




