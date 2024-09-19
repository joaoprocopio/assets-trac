export class Graph {
  nodes = new Map<string, Record<string, unknown>>()
  edges = new Map<string, Set<string>>()

  constructor() {
    // Hack pra permitir recursão do `buildSubtree` sem que o `this` seja redefinido durante as chamadas
    this.buildSubtree = this.buildSubtree.bind(this)
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id)
  }

  getNode(id: string): Record<string, unknown> | undefined {
    // Deep clone para não usar a referência/ponteiro original
    return structuredClone(this.nodes.get(id))
  }

  setNode(id: string, attributes?: Record<string, unknown>): void {
    this.nodes.set(id, attributes ?? {})
  }

  setEdge(parentId: string, childId: string): void {
    if (!this.edges.has(parentId)) {
      this.edges.set(parentId, new Set())
    }

    this.edges.get(parentId)!.add(childId)
  }

  findNodeRoot(nodeId: string): string | undefined {
    const node = this.nodes.get(nodeId)

    if (!node) {
      return undefined
    }

    if (!node.parentId) {
      return nodeId
    }

    return this.findNodeRoot(node.parentId)
  }

  filterNodes(predicate: (node: Record<string, unknown>) => boolean) {
    const filteredNodes = new Map<string, Record<string, unknown>>()

    for (const [nodeId, node] of this.nodes) {
      if (!predicate(node)) {
        continue
      }

      filteredNodes.set(nodeId, node)
    }

    return filteredNodes
  }

  buildSubtree(nodeId: string) {
    const node = this.getNode(nodeId)
    const children = this.edges.get(nodeId)

    if (children) {
      node!.children = Array.from(children).map(this.buildSubtree)
    }

    return node
  }

  buildTree() {
    const roots = new Set(this.nodes.keys())

    // Para encontrar as raízes da árvore
    // É necessário remover todos os nós que são filhos de outros nós
    for (const [, children] of this.edges) {
      for (const child of children) {
        roots.delete(child)
      }
    }
    // No fim, `roots` contém apenas os nós que são raízes da árvore
    // Podem ou não conter filhos, mas não são filhos de nenhum outro nó

    const tree = []

    for (const root of roots) {
      const subTree = this.buildSubtree(root)

      tree.push(subTree)
    }

    sortTree(tree)

    return tree
  }

  buildBacktracedTree(nodes: Map<string, Record<string, unknown>>) {
    const treeMap = new Map<string, Record<string, unknown>>()

    for (const [nodeId, node] of nodes) {
      if (treeMap.has(nodeId)) {
        continue
      }

      if (!node.parentId) {
        // Se não tem parentId, é raiz, então constrói a sub-árvore a partir desse nó
        const subTree = this.buildSubtree(nodeId)
        treeMap.set(nodeId, subTree)

        continue
      }

      const rootNodeId = this.findNodeRoot(node.parentId)

      if (!rootNodeId || treeMap.has(rootNodeId)) {
        continue
      }

      const subTree = this.buildSubtree(rootNodeId)

      treeMap.set(rootNodeId, subTree)
    }

    const tree = Array.from(treeMap.values())

    sortTree(tree)

    return tree
  }
}

function sortTree(tree: Record<string, unknown>[]) {
  const collator = new Intl.Collator("en-US", {
    numeric: true,
    sensitivity: "base",
  })

  tree.sort((currentNode, nextNode) => {
    if (currentNode.children && !nextNode.children) {
      return -1
    }

    if (!currentNode.children && nextNode.children) {
      return 1
    }

    return collator.compare(currentNode.name, nextNode.name)
  })
}
