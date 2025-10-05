import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { DataSet, Network } from "vis-network/standalone";
import type { Node, Edge } from "vis-network/standalone";
import NeoVis, { type NeovisConfig } from "neovis.js";
import { API_URL } from "../../config/globals";
import type { GraphNodeDto, GraphNodeType, GraphResponse } from "../../types/graph";
import { useAuth } from "../../components/AuthContext";
import { useToast } from "../../components/ToastContext";
import { ProgressSpinner } from "primereact/progressspinner";

interface AttachmentGraphPanelProps {
  datasetId?: string | null;
  heightClass?: string;
}

interface ActiveNode {
  type: GraphNodeType;
  id: string;
  nodeKey?: string;
}

const DEFAULT_DEPTH = 3;

function buildNodeLabel(node: GraphNodeDto): string {
  const base = node.label || node.key;
  if (node.type === "dataset") return `🗂️ ${base}`;
  if (node.type === "document") return `📄 ${base}`;
  return `🏷️ ${base}`;
}

function buildNodeColor(node: GraphNodeDto) {
  switch (node.type) {
    case "dataset":
      return { background: "#1d4ed8", border: "#60a5fa" };
    case "document":
      return { background: "#0f766e", border: "#2dd4bf" };
    case "tag":
      return { background: "#4d7c0f", border: "#a3e635" };
    default:
      return { background: "#334155", border: "#64748b" };
  }
}

function buildTooltip(node: GraphNodeDto): string {
  const props = node.properties ?? {};
  if (node.type === "dataset") {
    return `Kutatás: ${node.label}\nID: ${props.datasetId ?? node.key}`;
  }
  if (node.type === "document") {
    return `Melléklet: ${node.label}\nID: ${props.attachmentId ?? node.key}`;
  }
  return `Címke: ${node.label}`;
}

export const AttachmentGraphPanel = ({ datasetId, heightClass = "h-64" }: AttachmentGraphPanelProps) => {
  const { token } = useAuth();
  const { notifyError } = useToast();
  const [activeNode, setActiveNode] = useState<ActiveNode | null>(null);
  const [depth, setDepth] = useState<number>(DEFAULT_DEPTH);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerIdRef = useRef<string>(`graph-${Math.random().toString(36).slice(2, 10)}`);
  const dataRef = useRef<GraphResponse | null>(null);
  const datasetIdRef = useRef<string | null>(null);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (datasetId) {
      datasetIdRef.current = datasetId;
      setActiveNode({ type: "dataset", id: datasetId });
      setDepth(DEFAULT_DEPTH);
    } else {
      datasetIdRef.current = null;
      setActiveNode(null);
    }
  }, [datasetId]);

  useEffect(() => {
    if (!containerRef.current) return;


  }, []);

  const queryKey = useMemo(() => {
    if (!activeNode) return ["graph", "idle"];
    return ["graph", activeNode.type, activeNode.nodeKey ?? activeNode.id, depth];
  }, [activeNode, depth]);

  const graphQuery = useQuery<GraphResponse>({
    queryKey,
    enabled: Boolean(activeNode && token),
    queryFn: async () => {
      if (!activeNode) throw new Error("Nincs aktív csomópont");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      if (activeNode.type === "dataset") {
        const { data } = await axios.get<GraphResponse>(
          `${API_URL}/admin/datasets/${activeNode.id}/graph`,
          { params: { depth }, headers },
        );
        return data;
      }

      const params: Record<string, string | number | undefined> = {
        type: activeNode.type,
        depth,
        id: activeNode.id,
      };
      if (activeNode.nodeKey) {
        params.nodeKey = activeNode.nodeKey;
      }
      const { data } = await axios.get<GraphResponse>(`${API_URL}/admin/graph`, {
        params,
        headers,
      });
      return data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (!graphQuery.error) {
      lastErrorRef.current = null;
      return;
    }
    const error = graphQuery.error;
    const message =
      (axios.isAxiosError(error) &&
        (error.response?.data?.message as string | undefined)) ||
      (error as Error)?.message ||
      "Nem sikerült betölteni a gráfot";
    if (message !== lastErrorRef.current) {
      notifyError(message, "Gráf betöltési hiba");
      lastErrorRef.current = message;
    }
  }, [graphQuery.error, notifyError]);

  useEffect(() => {
    if (!containerIdRef.current) return;
    if (!containerRef.current) return;
    if (!graphQuery.data) return;


    console.log(containerIdRef)
const visConfig = {
    containerId: containerIdRef.current!,
    physics: {
      enabled: true,
      stabilization: true,
      barnesHut: {
        springLength: 800,
        avoidOverlap: 0.8,
      },
    },
    interaction: {
      hover: true,
      tooltipDelay: 120,
    },
    edges: {
      color: { color: "#94a3b8", highlight: "#facc15" },
      arrows: {
        to: { enabled: true, scaleFactor: 0.6 },
      },
      smooth: { enabled: true, type: "dynamic", roundness: 0.4 },
    },
    nodes: {
      borderWidth: 1,
      borderWidthSelected: 2,
      brokenImage: undefined,
      chosen: true,
      opacity: 1,
      fixed: {
        x: false,
        y: false,
      },
      font: {
        color: '#fff',
        size: 14,
        face: 'arial',
        background: 'none',
        strokeWidth: 0,
        strokeColor: '#ffffff',
        align: 'center',
        multi: false,
        vadjust: -20, // Move label above the icon for better visibility
        bold: {
          color: '#343434',
          size: 14,
          face: 'arial',
          vadjust: -20,
          mod: 'bold',
        },
        ital: {
          color: '#343434',
          size: 14,
          face: 'arial',
          vadjust: -20,
          mod: 'italic',
        },
        boldital: {
          color: '#343434',
          size: 14,
          face: 'arial',
          vadjust: -20,
          mod: 'bold italic',
        },
        mono: {
          color: '#343434',
          size: 15,
          face: 'courier new',
          vadjust: -18,
          mod: '',
        },
      },
      group: undefined,
      heightConstraint: false,
      hidden: false,
      icon: {
        face: 'FontAwesome',
        size: 50,
        color: '#2B7CE9', // Default color, overridden per node
      },
      image: undefined,
      imagePadding: {
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
      },
      labelHighlightBold: true,
      level: undefined,
      mass: 1,
      physics: true,
      scaling: {
        min: 10,
        max: 30,
        label: {
          enabled: false,
          min: 14,
          max: 30,
          maxVisible: 30,
          drawThreshold: 5,
        },
        
      },
      shadow: {
        enabled: false,
        color: 'rgba(0,0,0,0.5)',
        size: 10,
        x: 5,
        y: 5,
      },
      shape: 'icon', // Use icon shape for Font Awesome icons
      shapeProperties: {
        borderDashes: false,
        borderRadius: 6,
        interpolation: false,
        useImageSize: false,
        useBorderWithImage: false,
        coordinateOrigin: 'center',
      },
      size: 25,
      title: undefined,
      value: undefined,
      widthConstraint: { minimum: 80, maximum: 150 }, // Ensure space for label
    },
    layout: {
      improvedLayout: true,
    },
  } as const;


    // Transform data into vis.js format with type-based coloring and icons
    const nodes = graphQuery.data.nodes.map((n: GraphNodeDto) => {
      const colors = buildNodeColor(n);
      return {
        id: n.key,
        label: n.label, // Includes emoji as fallback
        shape: 'icon',
        icon: {
          face: 'FontAwesome',
          code: n.type === 'dataset' ? '\uf1c0' : n.type === 'document' ? '\uf15b' : '\uf02b', // Font Awesome codes
          size: n.type == "tag" ? 25 : n.type == "dataset" ? 70 : 40,
          color: colors.border, // Use border color for icon
        },
        color: colors,
        font: {
          ...visConfig.nodes.font,
          vadjust: -20, // Adjust label position above icon
        },
        size: 25
      };
    });
    console.log(nodes)

    const edges = graphQuery.data.edges?.map((e: any) => ({
      from: e.from,
      to: e.to,
      // Add more props if available
    })) || []; // Fallback if no edges

    // Create the vis.js Network directly
    const network = new Network(
      containerRef.current,  // Use the DOM ref directly
      { nodes, edges },      // Your custom data
      visConfig              // Your options
    );

    // Optional: Handle selection (similar to your code)
    network.on('selectNode', (params: { nodes: string[] }) => {
      if (!params.nodes?.length || !dataRef.current) return;
      const nodeId = params.nodes[0];
      const selected = dataRef.current.nodes.find((n: any) => n.key === nodeId);
      if (!selected) return;
      // Your selection logic here
    });

  }, [graphQuery.data]);

  const handleDepthChange = (value: number) => {
    const next = Number.isFinite(value) ? Math.round(value) : DEFAULT_DEPTH;
    setDepth(Math.max(1, Math.min(10, next)));
  };

  const handleReset = () => {
    if (datasetIdRef.current) {
      setActiveNode({ type: "dataset", id: datasetIdRef.current });
      setDepth(DEFAULT_DEPTH);
    }
  };

  if (!datasetId) {
    return (
      <div className="rounded border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-400">
        Válassz egy kutatást a gráf megjelenítéséhez.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-slate-400">Kapcsolati gráf</div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <label className="flex items-center gap-1">
            Mélység:
            <input
              type="number"
              min={1}
              max={10}
              value={depth}
              onChange={(event) => handleDepthChange(Number(event.target.value))}
              className="w-16 rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </label>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:border-slate-500 hover:text-white"
          >
            Gyökér
          </button>
        </div>
      </div>

      <div className={`relative ${heightClass} w-full overflow-hidden rounded border border-slate-700 bg-slate-950/60`}>
        <div ref={containerRef} id={containerIdRef.current} className="absolute inset-0" />
        {graphQuery.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
            <ProgressSpinner style={{ width: "32px", height: "32px" }} strokeWidth="4" />
          </div>
        ) : null}
        {graphQuery.isError ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-rose-300">
            Nem sikerült megjeleníteni a gráfot.
          </div>
        ) : null}
      </div>
    </div>
  );
};
