"use client";
import React, { useState, useEffect, useRef } from "react";
import { DrawIoEmbed } from "react-drawio";
import ChatPanel from "@/components/chat-panel";
import { useDiagram } from "@/contexts/diagram-context";
import { NodeContextMenu } from "@/components/node-context-menu";
import { extractNodeById } from "@/lib/utils";

export default function Home() {
    const { 
        drawioRef, 
        handleDiagramExport, 
        chartXML, 
        deleteNodeFromDiagram,
        getSelectedNodeXml,
        addNodeToChat,
        setAddNodeToChatCallback,
    } = useDiagram();
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const diagramContainerRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<{ setInput: (text: string) => void } | null>(null);

    // Ensure hydration safety by only checking mobile after mount
    useEffect(() => {
        setMounted(true);
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Check on mount
        checkMobile();

        // Add event listener for resize
        window.addEventListener("resize", checkMobile);

        // Cleanup
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Add keyboard shortcut for toggling chat panel (Ctrl+B)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
                event.preventDefault();
                setIsChatVisible((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Set up the callback for adding node to chat
    useEffect(() => {
        if (setAddNodeToChatCallback) {
            setAddNodeToChatCallback((nodeXml: string) => {
                // Extract node value/text for the chat message
                const parser = new DOMParser();
                const doc = parser.parseFromString(nodeXml, "text/xml");
                const cell = doc.querySelector("mxCell");
                const nodeValue = cell?.getAttribute("value") || "节点";
                
                // Format message with node information
                const message = `节点信息：${nodeValue}\n\n节点 XML：\n\`\`\`xml\n${nodeXml}\n\`\`\``;
                
                // Set the input in chat panel
                if (chatInputRef.current) {
                    chatInputRef.current.setInput(message);
                }
            });
        }
    }, [setAddNodeToChatCallback]);

    // Listen for right-click events on the diagram container
    useEffect(() => {
        const container = diagramContainerRef.current;
        if (!container) return;

        const handleContextMenu = async (e: MouseEvent) => {
            e.preventDefault();
            
            // Get the iframe element
            const iframe = container.querySelector('iframe');
            if (!iframe || !iframe.contentWindow) return;

            // Get the position relative to the viewport
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            
            // Try to get selected cells from draw.io via postMessage
            try {
                // Send message to draw.io to get selected cells
                iframe.contentWindow.postMessage(JSON.stringify({
                    action: 'getSelectedCells'
                }), '*');

                // Listen for response
                const messageHandler = (event: MessageEvent) => {
                    try {
                        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                        if (data.action === 'selectedCells' && data.cells && data.cells.length > 0) {
                            // Use the first selected cell
                            const selectedCell = data.cells[0];
                            if (selectedCell.id) {
                                setSelectedNodeId(selectedCell.id);
                            }
                            window.removeEventListener('message', messageHandler);
                        }
                    } catch (err) {
                        // Ignore parse errors
                    }
                };

                window.addEventListener('message', messageHandler);

                // Fallback: if no response in 100ms, use the last node
                setTimeout(() => {
                    window.removeEventListener('message', messageHandler);
                    if (!selectedNodeId && chartXML) {
                        // Use the last non-base node as fallback
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(chartXML, "text/xml");
                        const root = doc.querySelector("mxGraphModel > root");
                        if (root) {
                            const cells = root.querySelectorAll("mxCell");
                            let lastNodeId: string | null = null;
                            cells.forEach((cell) => {
                                const cellId = cell.getAttribute("id");
                                if (cellId && cellId !== "0" && cellId !== "1") {
                                    lastNodeId = cellId;
                                }
                            });
                            setSelectedNodeId(lastNodeId);
                        }
                    }
                }, 100);
            } catch (error) {
                console.error("Error getting selected cells:", error);
                // Fallback to using last node
                if (chartXML) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(chartXML, "text/xml");
                    const root = doc.querySelector("mxGraphModel > root");
                    if (root) {
                        const cells = root.querySelectorAll("mxCell");
                        let lastNodeId: string | null = null;
                        cells.forEach((cell) => {
                            const cellId = cell.getAttribute("id");
                            if (cellId && cellId !== "0" && cellId !== "1") {
                                lastNodeId = cellId;
                            }
                        });
                        setSelectedNodeId(lastNodeId);
                    }
                }
            }
        };

        container.addEventListener('contextmenu', handleContextMenu);

        return () => {
            container.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [chartXML, selectedNodeId]);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => {
            setContextMenuPosition(null);
        };

        if (contextMenuPosition) {
            document.addEventListener('click', handleClick);
            return () => {
                document.removeEventListener('click', handleClick);
            };
        }
    }, [contextMenuPosition]);

    const handleDeleteNode = () => {
        if (selectedNodeId) {
            deleteNodeFromDiagram(selectedNodeId);
            setSelectedNodeId(null);
        }
    };

    const handleAddNodeToChat = async () => {
        if (selectedNodeId && chartXML) {
            const nodeXml = extractNodeById(chartXML, selectedNodeId);
            if (nodeXml) {
                addNodeToChat(nodeXml);
            }
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 relative">
            {/* Mobile warning overlay - only show after mount to prevent hydration mismatch */}
            {mounted && isMobile && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100">
                    <div className="text-center p-8">
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Please open this application on a desktop or laptop
                        </h1>
                    </div>
                </div>
            )}

            <div 
                ref={diagramContainerRef}
                className={`${isChatVisible ? 'w-2/3' : 'w-full'} p-1 h-full relative transition-all duration-300 ease-in-out`}
            >
                <DrawIoEmbed
                    ref={drawioRef}
                    onExport={handleDiagramExport}
                    urlParameters={{
                        spin: true,
                        libraries: false,
                        saveAndExit: false,
                        noExitBtn: true,
                    }}
                />
                {contextMenuPosition && (
                    <NodeContextMenu
                        position={contextMenuPosition}
                        onDeleteNode={handleDeleteNode}
                        onAddToChat={handleAddNodeToChat}
                        onClose={() => setContextMenuPosition(null)}
                    />
                )}
            </div>
            <div className={`${isChatVisible ? 'w-1/3' : 'w-12'} h-full p-1 transition-all duration-300 ease-in-out`}>
                <ChatPanel
                    ref={chatInputRef}
                    isVisible={isChatVisible}
                    onToggleVisibility={() => setIsChatVisible(!isChatVisible)}
                />
            </div>
        </div>
    );
}
