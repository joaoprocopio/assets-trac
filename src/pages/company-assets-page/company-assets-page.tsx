import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { useMemo, useRef, useState } from "react"

import AlertIcon from "~/assets/icons/alert-icon.svg?react"
import AssetIcon from "~/assets/icons/asset-icon.svg?react"
import ChevronDownIcon from "~/assets/icons/chevron-down-icon.svg?react"
import ComponentIcon from "~/assets/icons/component-icon.svg?react"
import LocationIcon from "~/assets/icons/location-icon.svg?react"
import OperatingIcon from "~/assets/icons/operating-icon.svg?react"
import SearchIcon from "~/assets/icons/search-icon.svg?react"
import { CompanyAtoms } from "~/atoms"
import { Button } from "~/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/card"
import { Input } from "~/components/input"
import { Separator } from "~/components/separator"
import { Skeleton } from "~/components/skeleton"
import { Tree } from "~/components/tree"
import { Typography } from "~/components/typography"
import { CompanyConstants } from "~/constants"
import { useDebouncedFn } from "~/hooks/use-debounce"
import { RESET_SEARCH_PARAM, useSearchParam } from "~/hooks/use-search-param"
import type { CompanySchemas } from "~/schemas"
import { CompanyServices } from "~/services"

export function CompanyAssetsPage() {
  const treeWrapperRef = useRef<HTMLDivElement>(null)

  const [assetStatus, setAssetStatus] = useSearchParam<CompanyConstants.TAssetStatus>({
    paramKey: "s",
  })
  const [assetQuery, setAssetQuery] = useSearchParam<string>({
    paramKey: "q",
  })

  const company = useAtomValue(CompanyAtoms.companyAtom)
  const [asset, setAsset] = useState()

  const locations = useQuery({
    queryFn: () => CompanyServices.getCompanyLocations(company!.id),
    queryKey: [CompanyServices.GetCompanyLocationsKey, company?.id],
    enabled: typeof company?.id === "string",
  })

  const assets = useQuery({
    queryFn: () => CompanyServices.getCompanyAssets(company!.id),
    queryKey: [CompanyServices.GetCompanyAssetsKey, company?.id],
    enabled: typeof company?.id === "string",
  })

  const graph = useMemo(() => {
    if (!(locations.isSuccess && assets.isSuccess)) return undefined

    const graph = buildGraph(locations.data, assets.data)

    return graph
  }, [locations.data, assets.data, locations.isSuccess, assets.isSuccess])

  const tree = useMemo(() => {
    if (!graph) return undefined

    setAsset(undefined)

    const tree = buildTree(graph)

    return tree
  }, [graph, setAsset])

  // TODO: separar o controlled value e debounced value em componentes
  const handleChangeAssetStatus = useDebouncedFn((nextValue: CompanyConstants.TAssetStatus) => {
    if (assetStatus === nextValue) {
      return setAssetStatus(RESET_SEARCH_PARAM)
    }

    return setAssetStatus(nextValue)
  })

  const onSelectNode = (keys) => {
    const [key] = keys

    const node = graph?.getNode(key)

    setAsset(node)
  }

  const handleChangeAssetQuery = useDebouncedFn((event) => {
    if (!event.target.value.length) {
      return setAssetQuery(RESET_SEARCH_PARAM)
    }

    return setAssetQuery(event.target.value.trim().toLowerCase())
  })

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b">
        <CardTitle className="inline-flex items-end gap-1">
          Assets
          {company ? (
            <Typography className="font-normal" affects="muted">
              / {company.name} Unit
            </Typography>
          ) : (
            <Skeleton className="mb-0.5 h-4 w-20" />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="grid flex-grow basis-px grid-cols-[1fr_1px_1fr] overflow-hidden p-0">
        <div className="flex flex-col">
          <div className="sticky inset-0 z-10 flex gap-6 border-b bg-background px-6 py-4">
            <Input
              onChange={handleChangeAssetQuery}
              startIcon={SearchIcon}
              placeholder="Search assets"
            />

            <div className="flex gap-4">
              <Button
                className="h-10 gap-2"
                variant={
                  assetStatus === CompanyConstants.AssetStatus.Operating ? "default" : "outline"
                }
                onClick={() => handleChangeAssetStatus(CompanyConstants.AssetStatus.Operating)}>
                <OperatingIcon className="h-5 w-5" />
                Operating
              </Button>

              <Button
                className="h-10 gap-2"
                variant={assetStatus === CompanyConstants.AssetStatus.Alert ? "default" : "outline"}
                onClick={() => handleChangeAssetStatus(CompanyConstants.AssetStatus.Alert)}>
                <AlertIcon className="h-5 w-5" />
                Critical
              </Button>
            </div>
          </div>

          <div ref={treeWrapperRef} className="flex-grow basis-px p-6 pr-0">
            {!tree && (
              <div className="space-y-px pr-6">
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
              </div>
            )}

            {!!(tree && treeWrapperRef.current) && (
              <Tree
                className="!border-0"
                fieldNames={{
                  key: "id",
                  children: "children",
                  title: "name",
                }}
                showLine={true}
                defaultExpandAll={true}
                virtual={true}
                showIcon={true}
                height={treeWrapperRef.current.offsetHeight - 48}
                itemHeight={28}
                switcherIcon={(props) => {
                  return (
                    <ChevronDownIcon className={props.expanded && "-rotate-90 transition-all"} />
                  )
                }}
                icon={(props) => {
                  switch (props!.data!.type) {
                    case "location":
                      return <LocationIcon className="mx-auto h-full w-4" />
                    case "asset":
                      return <AssetIcon className="mx-auto h-full w-4" />
                    case "component":
                      return <ComponentIcon className="mx-auto h-full w-4" />
                  }
                }}
                titleRender={(props) => {
                  return (
                    <>
                      {props.name}
                      {props.status === CompanyConstants.AssetStatus.Alert && (
                        <span className="ml-2 inline-block h-3 w-3 rounded-full bg-destructive align-middle" />
                      )}
                      {props.status === CompanyConstants.AssetStatus.Operating && (
                        <span className="bg-success ml-2 inline-block h-3 w-3 rounded-full align-middle" />
                      )}
                    </>
                  )
                }}
                selectable={true}
                onSelect={onSelectNode}
                treeData={tree}
              />
            )}
          </div>
        </div>

        <Separator className="h-auto overflow-hidden" orientation="vertical" />

        <div className="overflow-y-scroll px-6 pb-6 pt-4">
          {!asset && <div></div>}

          <pre>{JSON.stringify(asset, null, 2)}</pre>
        </div>
      </CardContent>
    </Card>
  )
}

class Graph {
  private _nodes = new Map<string, Record<string, unknown>>()
  private _edges = new Map<string, Set<string>>()

  get nodes() {
    return this._nodes
  }

  get edges() {
    return this._edges
  }

  hasNode(id: string): boolean {
    return this._nodes.has(id)
  }

  getNode(id: string): Record<string, unknown> | undefined {
    return this._nodes.get(id)
  }

  setNode(id: string, attributes?: Record<string, unknown>): void {
    this._nodes.set(id, attributes ?? {})
  }

  setEdge(parentId: string, childId: string): void {
    if (!this._edges.has(parentId)) {
      this._edges.set(parentId, new Set())
    }

    this._edges.get(parentId)!.add(childId)
  }
}

function buildGraph(locations: CompanySchemas.TLocations, assets: CompanySchemas.TAssets) {
  const graph = new Graph()

  for (let locationIndex = 0; locationIndex < locations.length; locationIndex++) {
    const location = locations[locationIndex]

    graph.setNode(location.id, {
      ...location,
      type: "location",
    })

    if (location.parentId) {
      if (!graph.hasNode(location.parentId)) {
        graph.setNode(location.parentId)
      }

      graph.setEdge(location.parentId, location.id)
    }
  }

  for (let assetsIndex = 0; assetsIndex < assets.length; assetsIndex++) {
    const asset = assets[assetsIndex]

    graph.setNode(asset.id, {
      ...asset,
      type: asset.sensorId ? "component" : "asset",
    })

    if (asset.parentId) {
      if (!graph.hasNode(asset.parentId)) {
        graph.setNode(asset.parentId)
      }

      graph.setEdge(asset.parentId, asset.id)
    }
  }

  return graph
}

function buildTree(graph: Graph) {
  const roots = new Set(graph.nodes.keys())

  for (const [, children] of graph.edges) {
    for (const child of children) {
      roots.delete(child)
    }
  }

  const tree = []

  function buildSubtree(nodeId: string) {
    const node = graph.getNode(nodeId)
    const children = graph.edges.get(nodeId)

    if (children) {
      node!.children = Array.from(children).map(buildSubtree)
    }

    return node
  }

  for (const root of roots) {
    const subTree = buildSubtree(root)

    tree.push(subTree)
  }

  return tree
}
