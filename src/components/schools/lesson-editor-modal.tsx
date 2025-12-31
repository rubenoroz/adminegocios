"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, Save, Eye, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LessonEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moduleId: string;
    lesson: {
        id: string;
        title: string;
        content: string;
    } | null;
    onSaved: () => void;
}

export function LessonEditorModal({
    open,
    onOpenChange,
    moduleId,
    lesson,
    onSaved,
}: LessonEditorModalProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const { toast } = useToast();

    useEffect(() => {
        if (lesson) {
            setTitle(lesson.title);
            setContent(lesson.content);
        } else {
            setTitle("");
            setContent("");
        }
    }, [lesson]);

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);

        try {
            const res = await fetch(
                `/api/modules/${moduleId}/lessons?lessonId=${lesson?.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, content }),
                }
            );

            if (!res.ok) throw new Error("Failed to save");

            toast({ title: "Lección guardada exitosamente" });
            onSaved();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving lesson:", error);
            toast({ title: "Error al guardar la lección", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    // Simple markdown-to-HTML renderer for preview
    const renderMarkdown = (text: string) => {
        return text
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2 mt-4">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3 mt-5">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/\n/gim, '<br/>');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        Editar Lección
                    </DialogTitle>
                    <DialogDescription>
                        Modifica el contenido de la lección. Puedes usar formato Markdown.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Título de la lección
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Introducción a los conceptos básicos"
                            className="bg-slate-50"
                        />
                    </div>

                    <div className="space-y-2 flex-1">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Contenido
                                </label>
                                <TabsList className="h-8">
                                    <TabsTrigger value="edit" className="h-7 px-3 text-xs gap-1">
                                        <Edit size={12} /> Editar
                                    </TabsTrigger>
                                    <TabsTrigger value="preview" className="h-7 px-3 text-xs gap-1">
                                        <Eye size={12} /> Vista previa
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="edit" className="mt-0">
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Escribe el contenido de la lección usando Markdown...

# Título principal
## Subtítulo

- Punto 1
- Punto 2

**Texto en negrita** y *cursiva*"
                                    rows={15}
                                    className="bg-slate-50 resize-none font-mono text-sm"
                                />
                            </TabsContent>

                            <TabsContent value="preview" className="mt-0">
                                <div
                                    className="bg-white border border-slate-200 rounded-md p-4 min-h-[300px] prose prose-slate max-w-none text-sm"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<span class="text-slate-400 italic">Vista previa del contenido...</span>' }}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !title.trim()}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
