"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ButtonWithTooltip } from "@/components/button-with-tooltip";
import { Download } from "lucide-react";
import { useDiagram } from "@/contexts/diagram-context";

export function ExportMenu() {
  const { handleExport } = useDiagram();

  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
