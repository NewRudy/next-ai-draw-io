"use client";

import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import type { DrawIoEmbedRef } from "react-drawio";
import { extractDiagramXML } from "../lib/utils";

interface DiagramContextType {
    chartXML: string;
    latestSvg: string;
    diagramHistory: { svg: string; xml: string }[];
    loadDiagram: (chart: string) => void;
    handleExport: (format?: "xml" | "png" | "svg") => void;
    resolverRef: React.Ref<((value: string) => void) | null>;
    drawioRef: React.Ref<DrawIoEmbedRef | null>;
    handleDiagramExport: (data: any) => void;
    clearDiagram: () => void;
    clearHistory: () => void;
    deleteHistoryItem: (index: number) => void;
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

export function DiagramProvider({ children }: { children: React.ReactNode }) {
    const [chartXML, setChartXML] = useState<string>("");
    const [latestSvg, setLatestSvg] = useState<string>("");
    const [diagramHistory, setDiagramHistory] = useState<
        { svg: string; xml: string }[]
    >([]);
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

    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("diagramHistory", JSON.stringify(diagramHistory));
    }, [diagramHistory]);

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

    const deleteHistoryItem = (index: number) => {
        setDiagramHistory((prev) => {
            const newHistory = prev.filter((_, i) => i !== index);
            return newHistory;
        });
    };

    return (
        <DiagramContext.Provider
            value={{
                chartXML,
                latestSvg,
                diagramHistory,
                loadDiagram,
                handleExport,
                resolverRef,
                drawioRef,
                handleDiagramExport,
                clearDiagram,
                clearHistory,
                deleteHistoryItem,
            }}
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
