"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDiagram } from "@/contexts/diagram-context";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Trash2 } from "lucide-react";

interface HistoryDialogProps {
    showHistory: boolean;
    onToggleHistory: (show: boolean) => void;
}

export function HistoryDialog({
    showHistory,
    onToggleHistory,
}: HistoryDialogProps) {
    const { loadDiagram: onDisplayChart, diagramHistory, clearHistory, deleteHistoryItem } = useDiagram();

    return (
        <Dialog open={showHistory} onOpenChange={onToggleHistory}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Diagram History</DialogTitle>
                    <DialogDescription>
                        Here saved each diagram before AI modification.
                        <br />
                        Click on a diagram to restore it
                    </DialogDescription>
                </DialogHeader>

                {diagramHistory.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                        No history available yet. Send messages to create
                        diagram history.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                        {diagramHistory.map((item, index) => (
                            <ContextMenu key={index}>
                                <ContextMenuTrigger>
                                    <div
                                        className="border rounded-md p-2 cursor-pointer hover:border-primary transition-colors"
                                        onClick={() => {
                                            onDisplayChart(item.xml);
                                            onToggleHistory(false);
                                        }}
                                    >
                                        <div className="aspect-video bg-white rounded overflow-hidden flex items-center justify-center">
                                            {item.svg.startsWith('data:') ? (
                                                <img
                                                    src={item.svg}
                                                    alt={`Diagram version ${index + 1}`}
                                                    className="object-contain w-full h-full p-1"
                                                />
                                            ) : (
                                                <div className="text-xs text-gray-400">No preview</div>
                                            )}
                                        </div>
                                        <div className="text-xs text-center mt-1 text-gray-500">
                                            Version {index + 1}
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem
                                        className="text-destructive"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (confirm("Are you sure you want to delete this version?")) {
                                                deleteHistoryItem(index);
                                            }
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Version
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            if (confirm("Are you sure you want to clear all history?")) {
                                clearHistory();
                            }
                        }}
                    >
                        Clear History
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onToggleHistory(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
