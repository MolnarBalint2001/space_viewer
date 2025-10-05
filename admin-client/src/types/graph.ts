export type GraphNodeType = "dataset" | "document" | "tag";

export interface GraphNodeDto {
  key: string;
  type: GraphNodeType;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdgeDto {
  id: string;
  type: string;
  from: string;
  to: string;
  properties: Record<string, unknown>;
}

export interface GraphResponse {
  root: string;
  depth: number;
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
}
