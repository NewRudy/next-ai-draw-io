"use client";

import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import type { DrawIoEmbedRef } from "react-drawio";
import { extractDiagramXML, extractNodes } from "../lib/utils";

interface SavedNode {
    id: string;
    name: string;
    xml: string;
    savedAt: string;
}

interface DiagramContextType {
    chartXML: string;
    latestSvg: string;
    diagramHistory: { svg: string; xml: string }[];
    savedNodes: SavedNode[];
    loadDiagram: (chart: string) => void;
    handleExport: (format?: "xml" | "png" | "svg") => void;
    resolverRef: React.Ref<((value: string) => void) | null>;
    drawioRef: React.Ref<DrawIoEmbedRef | null>;
    handleDiagramExport: (data: any) => void;
    clearDiagram: () => void;
    clearHistory: () => void;
    saveNodes: () => void;
    deleteNode: (nodeId: string) => void;
    deleteNodeFromDiagram: (nodeId: string) => void;
    getSelectedNodeXml: () => Promise<string | null>;
    addNodeToChat: (nodeXml: string) => void;
    setAddNodeToChatCallback: (callback: (nodeXml: string) => void) => void;
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

export function DiagramProvider({ children }: { children: React.ReactNode }) {
    const [chartXML, setChartXML] = useState<string>("");
    const [latestSvg, setLatestSvg] = useState<string>("");
    const [diagramHistory, setDiagramHistory] = useState<
        { svg: string; xml: string }[]
    >([]);
    const [savedNodes, setSavedNodes] = useState<SavedNode[]>([]);
    const drawioRef = useRef<DrawIoEmbedRef | null>(null);
    const resolverRef = useRef<((value: string) => void) | null>(null);

    const [exportFormat, setExportFormat] = useState<"xml" | "png" | "svg">("xml");

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem("diagramHistory");
        if (savedHistory) {
            try {
                setDiagramHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse diagram history", e);
            }
        }
    }, []);

    // Load saved nodes from localStorage on mount
    useEffect(() => {
        const savedNodesData = localStorage.getItem("savedNodes");
        if (savedNodesData) {
            try {
                setSavedNodes(JSON.parse(savedNodesData));
            } catch (e) {
                console.error("Failed to parse saved nodes", e);
            }
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("diagramHistory", JSON.stringify(diagramHistory));
    }, [diagramHistory]);

    // Save nodes to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("savedNodes", JSON.stringify(savedNodes));
    }, [savedNodes]);

    const handleExport = (format: "xml" | "png" | "svg" = "xml") => {
        if (drawioRef.current) {
            setExportFormat(format);
            drawioRef.current.exportDiagram({
                format: format === "xml" ? "xmlsvg" : format,
            });
        }
    };

    const loadDiagram = (chart: string) => {
        if (drawioRef.current) {
            drawioRef.current.load({
                xml: chart,
            });
        }
    };

    const handleDiagramExport = (data: any) => {
        // If it's a pure export (not for AI context), handle download
        if (exportFormat !== "xml") { // "xml" is default for AI context (xmlsvg)
            // But wait, AI context uses "xmlsvg" which returns data.
            // If user requested PNG/SVG, data.data is the base64 string.

            if (exportFormat === "png" || exportFormat === "svg") {
                const link = document.createElement("a");
                // Ensure data URL format for PNG/SVG exports
                const mimeType = exportFormat === "png" ? "image/png" : "image/svg+xml";
                const dataUrl = data.data.startsWith('data:') ? data.data : `data:${mimeType};base64,${data.data}`;
                link.href = dataUrl;
                link.download = `diagram.${exportFormat}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // Reset format to default for AI interactions
                setExportFormat("xml");
                return;
            }
        }

        // For AI context or XML export
        const extractedXML = extractDiagramXML(data.data);

        // If user explicitly requested XML export
        if (exportFormat === "xml" && !resolverRef.current) {
            const blob = new Blob([extractedXML], { type: "text/xml" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "diagram.drawio";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        setChartXML(extractedXML);
        setLatestSvg(data.data);

        // Only add to history if it's a new change (simple check) or if history is empty
        // We limit history to 20 items to save space
        setDiagramHistory((prev) => {
            const newHistory = [
                ...prev,
                {
                    svg: data.data,
                    xml: extractedXML,
                },
            ];
            return newHistory.slice(-20); // Keep last 20
        });

        if (resolverRef.current) {
            resolverRef.current(extractedXML);
            resolverRef.current = null;
        }

        // Reset format
        setExportFormat("xml");
    };

    const clearDiagram = () => {
        const emptyDiagram = `<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>`;
        loadDiagram(emptyDiagram);
        setChartXML(emptyDiagram);
        setLatestSvg("");
        // We don't clear history here, only current diagram
    };

    const clearHistory = () => {
        setDiagramHistory([]);
        localStorage.removeItem("diagramHistory");
    };

    const saveNodes = () => {
        if (!chartXML) {
            alert("没有可保存的图表");
            return;
        }

        const nodes = extractNodes(chartXML);
        if (nodes.length === 0) {
            alert("图表中没有可保存的节点");
            return;
        }

        const newNodes: SavedNode[] = nodes.map((nodeXml, index) => {
            // Try to extract node name from value attribute or use default
            const parser = new DOMParser();
            const doc = parser.parseFromString(nodeXml, "text/xml");
            const cell = doc.querySelector("mxCell");
            const value = cell?.getAttribute("value") || `节点 ${index + 1}`;
            const nodeId = cell?.getAttribute("id") || `node-${Date.now()}-${index}`;

            return {
                id: nodeId,
                name: value.length > 30 ? value.substring(0, 30) + "..." : value,
                xml: nodeXml,
                savedAt: new Date().toISOString(),
            };
        });

        setSavedNodes((prev) => {
            // Merge with existing nodes, avoiding duplicates by id
            const existingIds = new Set(prev.map((n) => n.id));
            const uniqueNewNodes = newNodes.filter((n) => !existingIds.has(n.id));
            return [...prev, ...uniqueNewNodes];
        });

        alert(`成功保存 ${newNodes.length} 个节点`);
    };

    const deleteNode = (nodeId: string) => {
        setSavedNodes((prev) => prev.filter((node) => node.id !== nodeId));
    };

    // Delete a node from the current diagram by its ID
    const deleteNodeFromDiagram = (nodeId: string) => {
        if (!chartXML) {
            return;
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(chartXML, "text/xml");
            const root = doc.querySelector("mxGraphModel > root");
            
            if (!root) {
                return;
            }

            // Find and remove the node with the given ID
            const cells = root.querySelectorAll("mxCell");
            cells.forEach((cell) => {
                if (cell.getAttribute("id") === nodeId) {
                    cell.remove();
                }
            });

            // Convert back to XML string
            const serializer = new XMLSerializer();
            const updatedXML = serializer.serializeToString(doc);
            
            // Reload the diagram with updated XML
            loadDiagram(updatedXML);
            setChartXML(updatedXML);
        } catch (error) {
            console.error("Error deleting node from diagram:", error);
        }
    };

    // Get the XML of the currently selected node
    const getSelectedNodeXml = async (): Promise<string | null> => {
        if (!drawioRef.current) {
            return null;
        }

        try {
            // Export current diagram to get XML
            const xmlPromise = new Promise<string>((resolve) => {
                if (resolverRef && "current" in resolverRef) {
                    resolverRef.current = resolve;
                }
                handleExport("xml");
            });

            const currentXml = await Promise.race([
                xmlPromise,
                new Promise<string>((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), 5000)
                ),
            ]);

            // Try to get selected cells from draw.io
            // Since we can't directly access draw.io's API, we'll need to use postMessage
            // For now, we'll return the full XML and let the caller extract the node
            return currentXml;
        } catch (error) {
            console.error("Error getting selected node:", error);
            return null;
        }
    };

    // Add node to chat - this will be handled by setting a callback
    const addNodeToChatCallbackRef = useRef<((nodeXml: string) => void) | null>(null);
    
    const addNodeToChat = (nodeXml: string) => {
        if (addNodeToChatCallbackRef.current) {
            addNodeToChatCallbackRef.current(nodeXml);
        }
    };

    // Expose a way to set the callback
    const setAddNodeToChatCallback = (callback: (nodeXml: string) => void) => {
        addNodeToChatCallbackRef.current = callback;
    };

    return (
        <DiagramContext.Provider
            value={{
                chartXML,
                latestSvg,
                diagramHistory,
                savedNodes,
                loadDiagram,
                handleExport,
                resolverRef,
                drawioRef,
                handleDiagramExport,
                clearDiagram,
                clearHistory,
                saveNodes,
                deleteNode,
                deleteNodeFromDiagram,
                getSelectedNodeXml,
                addNodeToChat,
                setAddNodeToChatCallback,
            } as DiagramContextType}
        >
            {children}
        </DiagramContext.Provider>
    );
}

export function useDiagram() {
    const context = useContext(DiagramContext);
    if (context === undefined) {
        throw new Error("useDiagram must be used within a DiagramProvider");
    }
    return context;
}
