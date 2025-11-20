"use client";

import { useEffect, useState } from "react";
import { Trash2, MessageSquare } from "lucide-react";

interface NodeContextMenuProps {
  position: { x: number; y: number } | null;
  onDeleteNode: () => void;
  onAddToChat: () => void;
  onClose: () => void;
}

export function NodeContextMenu({
  position,
  onDeleteNode,
  onAddToChat,
  onClose,
}: NodeContextMenuProps) {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (position) {
        onClose();
      }
    };

    if (position) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [position, onClose]);

  if (!position) {
    return null;
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteNode();
    onClose();
  };

  const handleAddToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToChat();
    onClose();
  };

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px] z-[1000]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
        删除节点
      </button>
      <button
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={handleAddToChat}
      >
        <MessageSquare className="h-4 w-4" />
        添加到对话
      </button>
    </div>
  );
}

