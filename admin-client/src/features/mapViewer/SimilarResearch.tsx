import { SimilarResearchItem, SimilarResearchEntry } from "./SimilarResearchItem";

const testData: SimilarResearchEntry[] = [
  {
    id: "dataset-2025",
    title: "Nap 2025",
    description: "A Nap felsz�n�nek komperiz�ci�s kutat�sa 2024-hez k�pest.",
    createdAt: "2025-10-04T18:11:00.808Z",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DT1567.jpg",
  },
  {
    id: "dataset-aurora",
    title: "Aur�ra 10 �ves trendsor",
    description: "Megfigyel�si adatok a sarki f�nyek intenzit�s�r�l, spektrumokr�l �s m�gneses mez�kr�l.",
    createdAt: "2025-09-12T09:30:00.000Z",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "dataset-corona",
    title: "Korona h�eloszl�s t�rk�pek",
    description: "�j h�t�rk�pek a koron�ban v�gzett URI spektroszk�piai m�r�sek alapj�n.",
    createdAt: "2025-07-28T14:05:12.000Z",
    imageUrl: "https://images.unsplash.com/photo-1470115636492-6d2b56f9146e?auto=format&fit=crop&w=320&q=80",
  },

  {
    id: "dataset-2025",
    title: "Nap 2025",
    description: "A Nap felsz�n�nek komperiz�ci�s kutat�sa 2024-hez k�pest.",
    createdAt: "2025-10-04T18:11:00.808Z",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DT1567.jpg",
  },
  {
    id: "dataset-aurora",
    title: "Aur�ra 10 �ves trendsor",
    description: "Megfigyel�si adatok a sarki f�nyek intenzit�s�r�l, spektrumokr�l �s m�gneses mez�kr�l.",
    createdAt: "2025-09-12T09:30:00.000Z",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "dataset-corona",
    title: "Korona h�eloszl�s t�rk�pek",
    description: "�j h�t�rk�pek a koron�ban v�gzett URI spektroszk�piai m�r�sek alapj�n.",
    createdAt: "2025-07-28T14:05:12.000Z",
    imageUrl: "https://images.unsplash.com/photo-1470115636492-6d2b56f9146e?auto=format&fit=crop&w=320&q=80",
  },
];

export const SimilarResearch = () => {
  return (
    <section className="flex flex-col gap-4 p-4 text-white">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Explore</h2>
        <p className="text-sm text-white/70">
          Explore other datasets that investigate similar topics to your current selection.
        </p>
      </header>

      <div className="flex flex-col gap-4 overflow-x-hidden" >
        {testData.map((entry) => (
          <SimilarResearchItem key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
};


