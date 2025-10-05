import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { VirtualScroller, VirtualScrollerLazyEvent } from "primereact/virtualscroller";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { useMapSidebar } from "../../components/MapSidebarContext";

const PAGE_SIZE = 20;

export type LabeledFeaturesProps = {
  isActive: boolean;
};

type PolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

type PolygonRecord = {
  id: string;
  label: string;
  creatorUserId: number;
  creatorUserName: string;
  createdAt: string;
  geom: PolygonGeometry;
};

type PolygonResponse = {
  polygons: PolygonRecord[];
  total: number;
  skip: number;
  take: number;
};

const normalizePolygon = (geom?: PolygonGeometry) => {
  if (!geom || geom.type !== "Polygon" || !geom.coordinates?.length) {
    return null;
  }

  const ring = geom.coordinates[0];
  if (!ring || ring.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  ring.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;

  const path = ring
    .map(([x, y]) => {
      const nx = ((x - minX) / width) * 100;
      const ny = 100 - ((y - minY) / height) * 100;
      return `${nx.toFixed(2)},${ny.toFixed(2)}`;
    })
    .join(" ");

  return path;
};

const MiniPolygon = ({ geom }: { geom?: PolygonGeometry }) => {
  const path = useMemo(() => normalizePolygon(geom), [geom]);
  if (!path) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-md border border-white/10 bg-slate-800 text-xs text-white/50">
        No shape
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-16 w-16 rounded-md border border-white/10 bg-slate-900"
      preserveAspectRatio="xMidYMid meet"
    >
      <polygon points={path} className="fill-blue-500/30 stroke-blue-400 stroke-[2]" />
    </svg>
  );
};

export const LabeledFeatures = ({ isActive }: LabeledFeaturesProps) => {
  const [searchParams] = useSearchParams();
  const tilesKey = searchParams.get("tilesKey");
  const { labeledFeaturesRefreshToken } = useMapSidebar();

  const activeKeyRef = useRef<string | null>(tilesKey);

  const [items, setItems] = useState<(PolygonRecord | null)[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializedKey, setInitializedKey] = useState<string | null>(null);

  const pendingRanges = useRef(new Set<string>());
  const refreshTokenRef = useRef<number>(labeledFeaturesRefreshToken);

  useEffect(() => {
    activeKeyRef.current = tilesKey;
  }, [tilesKey]);

  const reset = useCallback(() => {
    setItems([]);
    setTotalRecords(0);
    setError(null);
    pendingRanges.current.clear();
  }, []);

  const fetchChunk = useCallback(
    async (skip: number, take: number) => {
      if (!tilesKey) {
        return;
      }
      const requestKey = `${tilesKey}:${skip}:${take}`;
      if (pendingRanges.current.has(requestKey)) {
        return;
      }
      pendingRanges.current.add(requestKey);
      setLoading(true);
      try {
        setError(null);
        const response = await axios.get<PolygonResponse>("http://localhost:3000/api/polygon", {
          params: { tileKey: tilesKey, skip, take },
        });

        if (activeKeyRef.current !== tilesKey) {
          return;
        }

        const { polygons, total } = response.data;
        const parsedTotal = Number(total);
        const sanitizedTotal = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : skip + polygons.length;

        setTotalRecords((prev) => (prev !== sanitizedTotal ? sanitizedTotal : prev));

        setItems((prev) => {
          const nextLength = Math.max(prev.length, sanitizedTotal);
          const next = prev.slice();
          if (next.length !== nextLength) {
            next.length = nextLength;
          }
          for (let i = 0; i < nextLength; i += 1) {
            if (typeof next[i] === "undefined") {
              next[i] = null;
            }
          }

          polygons.forEach((polygon, index) => {
            const position = skip + index;
            if (position < nextLength) {
              next[position] = polygon;
            }
          });

          return next;
        });
      } catch (err) {
        console.error("Failed to load polygons", err);
        setError("Unable to load labeled features.");
      } finally {
        pendingRanges.current.delete(requestKey);
        setLoading(false);
      }
    },
    [tilesKey]
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (!tilesKey) {
      reset();
      setInitializedKey(null);
      refreshTokenRef.current = labeledFeaturesRefreshToken;
      return;
    }

    const needsReload =
      initializedKey !== tilesKey || refreshTokenRef.current !== labeledFeaturesRefreshToken;

    if (!needsReload) {
      return;
    }

    reset();
    setInitializedKey(tilesKey);
    refreshTokenRef.current = labeledFeaturesRefreshToken;

    (async () => {
      await fetchChunk(0, PAGE_SIZE);
    })();
  }, [fetchChunk, initializedKey, isActive, labeledFeaturesRefreshToken, reset, tilesKey]);

  useEffect(() => {
    if (!isActive || !tilesKey) {
      return;
    }

    if (initializedKey === tilesKey && totalRecords === 0 && !loading && items.length === 0) {
      fetchChunk(0, PAGE_SIZE);
    }
  }, [fetchChunk, initializedKey, isActive, items.length, loading, tilesKey, totalRecords]);

  const handleLazyLoad = useCallback(
    (event: VirtualScrollerLazyEvent) => {
      if (!tilesKey) {
        return;
      }

      const first = event.first ?? 0;
      const rows = event.rows ?? PAGE_SIZE;
      if (totalRecords > 0 && first >= totalRecords) {
        return;
      }

      const slice = items.slice(first, first + rows);
      const needsFetch = slice.length === 0 || slice.some((entry) => entry === null);

      if (needsFetch) {
        fetchChunk(first, rows);
      }
    },
    [fetchChunk, items, tilesKey, totalRecords]
  );

  const itemTemplate = useCallback((item: PolygonRecord | null) => {
    if (!item) {
      return (
        <div className="flex animate-pulse items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="h-16 w-16 rounded-md bg-white/10" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-40 rounded-full bg-white/10" />
            <div className="h-3 w-32 rounded-full bg-white/10" />
            <div className="h-3 w-24 rounded-full bg-white/10" />
          </div>
        </div>
      );
    }

    const createdAtLabel = item.createdAt
      ? new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(item.createdAt))
      : "";

    return (
      <div className="hover:bg-slate-700/50 cursor-pointer flex mt-2 items-center gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-sm">
        <MiniPolygon geom={item.geom} />
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-white">{item.label}</div>
            <Tag value={`#${item.id}`} severity="info" className="text-xs" />
          </div>
          <div className="text-sm text-white/70">{`Created by ${item.creatorUserName}`}</div>
          <div className="text-xs text-white/40">{createdAtLabel}</div>
        </div>
      </div>
    );
  }, []);

  const emptyTemplate = useMemo(() => (
    <div className="flex h-full w-full items-center justify-center text-white/50">
      {tilesKey ? "No labeled features were found." : "Select a dataset to view labeled features."}
    </div>
  ), [tilesKey]);

  const loadingTemplate = useMemo(() => (
    <div className="flex h-24 items-center justify-center">
      <ProgressSpinner style={{ width: 32, height: 32 }} />
    </div>
  ), []);

  return (
    <div className="flex h-full min-h-[320px] flex-col gap-3 p-4 text-white">
      {error ? (
        <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      <div className="flex-1 overflow-hidden rounded-xl">
        <VirtualScroller
          items={items}
          lazy
          onLazyLoad={handleLazyLoad}
          itemSize={96}
          showLoader
          loading={loading}
          loadingTemplate={loadingTemplate}
          itemTemplate={itemTemplate}
          className="h-full"
          style={{ height: "100%", minHeight: "280px", pointerEvents: loading ? "none" : "auto" }}
          step={PAGE_SIZE}
          numToleratedItems={PAGE_SIZE}
        />
        {!loading && totalRecords === 0 ? emptyTemplate : null}
      </div>
    </div>
  );
};
