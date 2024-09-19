import { useQuery } from "@tanstack/react-query"
import { useAtom, useAtomValue } from "jotai"
import { useEffect, useMemo } from "react"

import { CompanyAtoms } from "~/atoms"
import { Card, CardContent } from "~/components/card"
import { CompanyConstants } from "~/constants"
import { Graph } from "~/datastructures"
import { RESET_SEARCH_PARAM, TSetSearchParamValue, useSearchParam } from "~/hooks"
import { CompanySchemas } from "~/schemas"
import { CompanyServices } from "~/services"

import { CompanyAssetsDetails, CompanyAssetsDetailsSkeleton } from "./company-assets-details"
import { CompanyAssetsFilter } from "./company-assets-filter"
import { CompanyAssetsHeader } from "./company-assets-header"
import { CompanyAssetsTree, CompanyAssetsTreeSkeleton } from "./company-assets-tree"

export function CompanyAssetsPage() {
  const selectedCompany = useAtomValue(CompanyAtoms.selectedCompanyAtom)
  const [selectedAsset, setSelectedAsset] = useAtom(CompanyAtoms.selectedAssetAtom)

  const [selectedAssetName, setSelectedAssetName] = useSearchParam<string>({
    paramKey: "an",
  })
  const [selectedAssetStatus, setSelectedAssetStatus] =
    useSearchParam<CompanyConstants.TAssetStatus>({
      paramKey: "as",
    })
  const [selectedAssetId, setSelectedAssetId] = useSearchParam<string>({
    paramKey: "ai",
  })

  const locationsQuery = useQuery({
    queryFn: () => CompanyServices.getCompanyLocations(selectedCompany!.id),
    queryKey: [CompanyServices.GetCompanyLocationsKey, selectedCompany?.id],
    enabled: typeof selectedCompany?.id === "string",
  })

  const assetsQuery = useQuery({
    queryFn: () => CompanyServices.getCompanyAssets(selectedCompany!.id),
    queryKey: [CompanyServices.GetCompanyAssetsKey, selectedCompany?.id],
    enabled: typeof selectedCompany?.id === "string",
  })

  const graph = useMemo(() => {
    if (!(locationsQuery.isSuccess && assetsQuery.isSuccess)) return undefined

    return buildGraph(locationsQuery.data, assetsQuery.data)
  }, [locationsQuery.data, assetsQuery.data, locationsQuery.isSuccess, assetsQuery.isSuccess])

  const tree = useMemo(() => {
    if (!graph) return undefined

    return graph.buildTree()
  }, [graph])

  const handleChangeSelectedAssetName: TSetSearchParamValue<string> = (nextAssetQuery) => {
    setSelectedAssetName(nextAssetQuery)
  }

  const handleChangeSelectedAssetStatus: TSetSearchParamValue<CompanyConstants.TAssetStatus> = (
    nextAssetStatus
  ) => {
    setSelectedAssetStatus(nextAssetStatus)
  }

  const handleChangeSelectedAssetId = (assetIds: string[]) => {
    const nextAssetId = assetIds[0]

    if (!nextAssetId || nextAssetId === selectedAssetId) {
      return setSelectedAssetId(RESET_SEARCH_PARAM)
    }

    return setSelectedAssetId(nextAssetId)
  }

  useEffect(() => {
    if (!graph) return
    if (!selectedAssetId) return
    if (selectedAsset?.id === selectedAssetId) return

    const nextAsset = graph.getNode(selectedAssetId)

    if (!nextAsset) {
      return setSelectedAssetId(RESET_SEARCH_PARAM)
    }

    setSelectedAsset(nextAsset as CompanySchemas.TAsset | CompanySchemas.TLocation)
  }, [graph, selectedAsset, selectedAssetId, setSelectedAsset, setSelectedAssetId])

  return (
    <Card className="flex h-full flex-col">
      <CompanyAssetsHeader className="border-b px-6 py-4" selectedCompany={selectedCompany} />

      <CardContent className="grid flex-grow grid-cols-[1fr_0.75fr] grid-rows-[4rem_1fr] overflow-hidden p-0">
        <CompanyAssetsFilter
          className="flex items-center gap-4 border-b px-6"
          selectedAssetName={selectedAssetName}
          selectedAssetStatus={selectedAssetStatus}
          handleChangeSelectedAssetName={handleChangeSelectedAssetName}
          handleChangeSelectedAssetStatus={handleChangeSelectedAssetStatus}
        />

        {graph && tree ? (
          <CompanyAssetsDetails className="row-span-3 border-l" selectedAsset={selectedAsset} />
        ) : (
          <CompanyAssetsDetailsSkeleton className="row-span-3 border-l" />
        )}

        {graph && tree ? (
          <CompanyAssetsTree
            className="p-6 pr-0"
            tree={tree}
            selectedAssetId={selectedAssetId}
            handleChangeSelectedAssetId={handleChangeSelectedAssetId}
          />
        ) : (
          <CompanyAssetsTreeSkeleton className="p-6" />
        )}
      </CardContent>
    </Card>
  )
}

function buildGraph(locations: CompanySchemas.TLocations, assets: CompanySchemas.TAssets) {
  const graph = new Graph()

  for (const location of locations) {
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

  for (const asset of assets) {
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
