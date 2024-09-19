import { useSetAtom } from "jotai"
import {
  BoxIcon,
  ChevronDownIcon,
  CircleIcon,
  CodepenIcon,
  MapPinIcon,
  ZapIcon,
} from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { CompanyAtoms } from "~/atoms"
import { Skeleton } from "~/components/skeleton"
import { Tree } from "~/components/tree"
import { CompanyConstants } from "~/constants"
import { Graph } from "~/datastructures"
import type { TSetSearchParamValue } from "~/hooks"
import { RESET_SEARCH_PARAM } from "~/hooks"
import type { CompanySchemas } from "~/schemas"
import { cn } from "~/utils"

// TODO: fazer a filtragem https://ant.design/components/tree#tree-demo-search
export interface ICompanyAssetsTreeProps extends React.HTMLAttributes<HTMLDivElement> {
  graph: Graph
  selectedAssetId?: string
  setSelectedAssetId: TSetSearchParamValue<string>
}

export function CompanyAssetsTree({
  graph,
  selectedAssetId,
  setSelectedAssetId,
  ...props
}: ICompanyAssetsTreeProps) {
  const [mounted, setMounted] = useState<boolean>(false)
  const treeWrapperRef = useRef<HTMLDivElement>(null)
  const setSelectedAsset = useSetAtom(CompanyAtoms.selectedAssetAtom)
  const defaultSelectedKeys = useMemo(() => [selectedAssetId || ""], [selectedAssetId])
  const tree = useMemo(() => {
    if (!graph) return undefined

    return graph.buildTree()
  }, [graph])
  const handleSelect = useCallback(
    ([nodeId]: React.Key[]) => {
      if (!nodeId) {
        setSelectedAssetId(RESET_SEARCH_PARAM)
        setSelectedAsset(undefined)
        return
      }

      setSelectedAssetId(nodeId as string)

      const asset = graph.getNode(nodeId as string)

      if (!asset) {
        setSelectedAssetId(RESET_SEARCH_PARAM)
        setSelectedAsset(undefined)
        return
      }

      setSelectedAsset(asset as CompanySchemas.TAsset | CompanySchemas.TLocation)
    },
    [graph, setSelectedAsset, setSelectedAssetId]
  )
  useEffect(() => {
    if (mounted) return
    if (!defaultSelectedKeys[0]?.length) return

    handleSelect(defaultSelectedKeys)
  }, [mounted, defaultSelectedKeys, handleSelect])
  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div ref={treeWrapperRef} {...props}>
      {!mounted && <CompanyAssetsTreeSkeleton className="pr-6" />}

      {mounted && (
        <Tree
          className="!border-0"
          fieldNames={{
            key: "id",
            children: "children",
            title: "name",
          }}
          treeData={tree}
          defaultSelectedKeys={defaultSelectedKeys}
          showLine={true}
          virtual={true}
          showIcon={true}
          selectable={true}
          height={treeWrapperRef.current!.offsetHeight - 48}
          itemHeight={28}
          switcherIcon={CompanyAssetsTreeNodeSwitcherIcon}
          icon={CompanyAssetsTreeNodeIcon}
          titleRender={CompanyAssetsTreeNodeTitle}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}

export interface ICompanyAssetsTreeSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CompanyAssetsTreeSkeleton({
  className,
  ...props
}: ICompanyAssetsTreeSkeletonProps) {
  return (
    <div className={cn("space-y-px", className)} {...props}>
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
  )
}

function CompanyAssetsTreeNodeSwitcherIcon(props) {
  return (
    <ChevronDownIcon
      className={cn("h-full w-4", {
        "-rotate-90": props.expanded,
      })}
    />
  )
}

function CompanyAssetsTreeNodeIcon(props) {
  switch (props.data.type) {
    case "location":
      return <MapPinIcon className="mx-auto h-full w-4" />
    case "asset":
      return <BoxIcon className="mx-auto h-full w-4" />
    case "component":
      return <CodepenIcon className="mx-auto h-full w-4" />
  }
}

function CompanyAssetsTreeNodeTitle(props) {
  if (!(props.status && props.sensorType)) return props.name

  const isAlert = props.status === CompanyConstants.AssetStatus.Alert
  const isOperating = props.status === CompanyConstants.AssetStatus.Operating

  const isEnergyType = props.sensorType === CompanyConstants.AssetSensorType.Energy
  const isVibrationType = props.sensorType === CompanyConstants.AssetSensorType.Vibration

  const classes = cn("ml-2 inline-block h-4 w-3", {
    "fill-destructive text-destructive": isAlert,
    "fill-success text-success": isOperating,
  })

  return (
    <>
      {props.name}

      {isEnergyType && <ZapIcon className={classes} />}
      {isVibrationType && <CircleIcon className={classes} />}
    </>
  )
}
