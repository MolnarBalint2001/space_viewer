export type SimilarResearchEntry = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
};

type SimilarResearchItemProps = {
  entry: SimilarResearchEntry;
};

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

  return (
    <article className="hover:bg-slate-700/50 flex items-center gap-4 overflow-hidden rounded-3xl p-4 backdrop-blur">
      <img
        alt={entry.title}
        src={entry.imageUrl}
        className="h-20 w-20 flex-shrink-0 rounded-xl object-cover shadow-lg ring-1 ring-blue-300/30"
      />
            <div className="flex flex-1 flex-col gap-1 text-white">
        <h3 className="text-lg font-semibold leading-tight drop-shadow-sm">{entry.title}</h3>
        <p className="text-sm text-white/80 leading-snug">{entry.description}</p>
        <p className="text-xs text-blue-100/80">Created: {createdLabel}</p>
      </div>
    </article>
  );
};




