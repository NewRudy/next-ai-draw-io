"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDiagram } from "@/contexts/diagram-context";
import { TEMPLATES } from "@/lib/templates";
import { LayoutTemplate } from "lucide-react";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateDialog({ open, onOpenChange }: TemplateDialogProps) {
  const { loadDiagram } = useDiagram();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Templates</DialogTitle>
          <DialogDescription>
            Choose a template to start with.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="border rounded-md p-4 cursor-pointer hover:border-primary transition-colors flex flex-col gap-2"
              onClick={() => {
                loadDiagram(template.xml);
                onOpenChange(false);
              }}
            >
              <div className="aspect-video bg-gray-100 rounded flex items-center justify-center text-gray-400">
                <LayoutTemplate className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-gray-500">
                  {template.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
