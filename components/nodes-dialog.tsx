"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDiagram } from "@/contexts/diagram-context";
import { Trash2, Download, Plus } from "lucide-react";
import { replaceNodes } from "@/lib/utils";

interface NodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NodesDialog({ open, onOpenChange }: NodesDialogProps) {
  const { savedNodes, deleteNode, chartXML, loadDiagram } = useDiagram();

  const handleDelete = (nodeId: string) => {
    if (confirm("确定要删除这个节点吗？")) {
      deleteNode(nodeId);
    }
  };

  const handleExport = (nodeXml: string, nodeName: string) => {
    const blob = new Blob([nodeXml], { type: "text/xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${nodeName.replace(/[^a-z0-9]/gi, "_")}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddToDiagram = (nodeXml: string) => {
    if (!chartXML) {
      alert("请先创建一个图表");
      return;
    }

    try {
      // Wrap the node in root tags if needed
      let nodeString = nodeXml;
      if (!nodeString.includes("<root>")) {
        nodeString = `<root>${nodeString}</root>`;
      }

      // Merge the node into the current diagram
      const updatedXML = replaceNodes(chartXML, nodeString);
      loadDiagram(updatedXML);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding node to diagram:", error);
      alert("添加节点到图表时出错");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>已保存的节点</DialogTitle>
          <DialogDescription>
            管理您保存的节点，可以将它们添加到图表中或导出为文件。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {savedNodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              还没有保存的节点
            </div>
          ) : (
            <div className="space-y-3">
              {savedNodes.map((node) => (
                <div
                  key={node.id}
                  className="border rounded-lg p-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {node.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {node.id}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      保存时间: {new Date(node.savedAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToDiagram(node.xml)}
                      title="添加到图表"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(node.xml, node.name)}
                      title="导出节点"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(node.id)}
                      title="删除节点"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

