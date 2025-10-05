export type SimilarResearchEntry = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  score?: number | null;
  tilesetKey?: string | null;
};

type SimilarResearchItemProps = {
  entry: SimilarResearchEntry;
};

const fallbackImage =
  "https://media.istockphoto.com/id/1198684732/photo/stars-and-galaxy-space-sky-night-background.jpg?s=612x612&w=0&k=20&c=U6AnXKYJpi9H2tCeGGXSAS_ctR4pgsC-yC07J5ECH5M=";

export const SimilarResearchItem = ({ entry }: SimilarResearchItemProps) => {
  const createdLabel = entry.createdAt
    ? new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(entry.createdAt))
    : "";

  const description = entry.description?.trim() || "No description provided.";
  const imageSrc = entry.imageUrl ?? fallbackImage;

  return (
    <article className="hover:bg-slate-700/50 flex items-center gap-4 overflow-hidden rounded-3xl p-4 backdrop-blur">
      <img
        alt={entry.title}
        src={imageSrc}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackImage;
        }}
        className="h-20 w-20 flex-shrink-0 rounded-xl object-cover shadow-lg ring-1 ring-blue-300/30"
      />
      <div className="flex flex-1 flex-col gap-1 text-white">
        <h3 className="text-lg font-semibold leading-tight drop-shadow-sm">{entry.title}</h3>
        <p className="text-sm text-white/80 leading-snug line-clamp-3">{description}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-blue-100/80">
          {createdLabel ? <span>Created: {createdLabel}</span> : null}
          {typeof entry.score === "number" ? (
            <span>Similarity: {entry.score.toFixed(3)}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
};
