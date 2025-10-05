import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { SimilarResearchItem, SimilarResearchEntry } from "./SimilarResearchItem";

type SimilarResearchApiItem = {
  datasetId: string;
  name?: string;
  description?: string | null;
  previewImageUrl?: string | null;
  createdAt?: string | null;
  score?: number | null;
  tilesetKey?: string | null;
};

export const SimilarResearch = () => {
  const [searchParams] = useSearchParams();
  const tilesKey = searchParams.get("tilesKey");

  const [items, setItems] = useState<SimilarResearchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSimilars = useCallback(async () => {
    if (!tilesKey) {
      return;
    }

    setIsLoading(true);
    setError(null);

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await axios.get("http://localhost:3000/api/datasets/similar", {
        params: { tilesKey },
        signal: controller.signal,
      });

      const apiItems: SimilarResearchApiItem[] = response.data?.items ?? [];
      const mapped: SimilarResearchEntry[] = apiItems
        .filter((item) => item?.datasetId)
        .map((item) => ({
          id: item.datasetId,
          title: item.name ?? "Unknown dataset",
          description: item.description ?? null,
          imageUrl: item.previewImageUrl ?? null,
          createdAt: item.createdAt ?? null,
          score: item.score ?? null,
          tilesetKey: item.tilesetKey ?? null,
        }));

      setItems(mapped);
    } catch (error: unknown) {
      if (axios.isCancel && axios.isCancel(error)) {
        return;
      }

      console.error("Failed to load similar datasets", error);
      setError("Unable to load similar researches right now.");
      setItems([]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [tilesKey]);

  useEffect(() => {
    if (!tilesKey) {
      setItems([]);
      setError(null);
      setIsLoading(false);
      if (abortRef.current) {
        abortRef.current.abort();
      }
      return;
    }

    fetchSimilars();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [tilesKey, fetchSimilars]);

  return (
    <section className="flex flex-col gap-4 p-4 text-white">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Explore</h2>
        <p className="text-sm text-white/70">
          Explore other datasets that investigate similar topics to your current selection.
        </p>
      </header>

      <div className="flex flex-col gap-4 overflow-x-hidden">
        {!tilesKey ? (
          <p className="text-sm text-white/60">
            Select a dataset on the map to see related researches.
          </p>
        ) : null}

        {tilesKey && isLoading ? (
          <p className="text-sm text-white/60">Looking for similar researches...</p>
        ) : null}

        {tilesKey && !isLoading && error ? (
          <p className="text-sm text-red-200">{error}</p>
        ) : null}

        {tilesKey && !isLoading && !error && items.length === 0 ? (
          <p className="text-sm text-white/60">No similar researches found for this dataset yet.</p>
        ) : null}

        {items.map((entry) => (
          <SimilarResearchItem key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
};




