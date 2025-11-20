"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ButtonWithTooltip } from "@/components/button-with-tooltip";
import { Download, Save, Package } from "lucide-react";
import { useDiagram } from "@/contexts/diagram-context";
import { NodesDialog } from "@/components/nodes-dialog";

export function ExportMenu() {
  const { handleExport, saveNodes } = useDiagram();
  const [showNodesDialog, setShowNodesDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonWithTooltip
            tooltipContent="Export Diagram"
            variant="ghost"
            size="icon"
          >
            <Download className="h-5 w-5" />
          </ButtonWithTooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport("xml")}>
            Export as .drawio (XML)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("png")}>
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("svg")}>
            Export as SVG
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={saveNodes}>
            <Save className="h-4 w-4 mr-2" />
            保存为节点
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowNodesDialog(true)}>
            <Package className="h-4 w-4 mr-2" />
            查看已保存的节点
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NodesDialog open={showNodesDialog} onOpenChange={setShowNodesDialog} />
    </>
  );
}
