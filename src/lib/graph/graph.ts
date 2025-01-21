export type TGraphNodeId = string
export type TGraphNodeParentId = string | null

export type TGraphNode<Node> = {
  id: TGraphNodeId
  parentId: TGraphNodeParentId
} & Node

export type TGraphNodeMap<Node> = Map<TGraphNodeId, TGraphNode<Node> | undefined>
export type TGraphEdgeMap = Map<TGraphNodeId, Set<TGraphNodeId>>
export type TGraphRootSet = Set<TGraphNodeId>

export class Graph<Node> {
  #nodes: TGraphNodeMap<Node> = new Map()
  #edges: TGraphEdgeMap = new Map()
  #roots: TGraphRootSet = new Set()

  getAllRoots(): TGraphRootSet {
    return this.#roots
  }

  getAllNodes(): TGraphNodeMap<Node> {
    return this.#nodes
  }

  getAllEdges(): TGraphEdgeMap {
    return this.#edges
  }

  filterNodes(predicate: (node: TGraphNode<Node>) => boolean): TGraphNodeMap<Node> {
    const filtered: TGraphNodeMap<Node> = new Map()
    const nodes: TGraphNodeMap<Node> = this.getAllNodes()

    for (const [nodeId, node] of nodes.entries()) {
      if (!node) {
        continue
      }

      if (!predicate(node)) {
        continue
      }

      filtered.set(nodeId, node)
    }

    return filtered
  }

  addRoot(nodeId: TGraphNodeId): void {
    this.#roots.add(nodeId)
  }

  addNode(nodeId: TGraphNodeId, nodeAttributes?: TGraphNode<Node>): void {
    this.#nodes.set(nodeId, nodeAttributes)
  }

  getNode(nodeId: TGraphNodeId): TGraphNode<Node> | undefined {
    const node = this.#nodes.get(nodeId)

    if (!node) {
      return undefined
    }

    return node
  }

  hasNode(nodeId: TGraphNodeId): boolean {
    return this.#nodes.has(nodeId)
  }

  addEdge(edgeId: TGraphNodeId, nodeId: TGraphNodeId): void {
    if (!this.#edges.has(edgeId)) {
      this.#edges.set(edgeId, new Set())
    }

    this.#edges.get(edgeId)!.add(nodeId)
  }

  getEdge(edgeId: TGraphNodeId): Set<TGraphNodeId> | undefined {
    const edge = this.#edges.get(edgeId)

    if (!edge) {
      return undefined
    }

    return edge
  }

  hasEdge(edgeId: string): boolean {
    return this.#edges.has(edgeId)
  }
}
