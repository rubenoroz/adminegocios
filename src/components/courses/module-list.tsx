
"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Module {
    id: string;
    title: string;
    order: number;
    lessons: any[]; // refine later
    quizzes: any[]; // refine later
}

interface ModuleListProps {
    items: Module[];
    courseId: string;
}

export const ModuleList = ({ items, courseId }: ModuleListProps) => {
    const [isMounted, setIsMounted] = useState(false);
    const [modules, setModules] = useState(items);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setModules(items);
    }, [items]);

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;

        if (sourceIndex === destIndex) return;

        const reordered = Array.from(modules);
        const [removed] = reordered.splice(sourceIndex, 1);
        reordered.splice(destIndex, 0, removed);

        // Optimistic update
        setModules(reordered);

        // Prepare bulk update payload
        const bulkUpdateData = reordered.map((module, index) => ({
            id: module.id,
            order: index + 1
        }));

        try {
            await fetch(`/api/courses/${courseId}/modules`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ list: bulkUpdateData }),
            });
            router.refresh();
        } catch (error) {
            console.error("Failed to reorder modules", error);
            // Revert (could add toast)
        }
    };

    if (!isMounted) {
        return null; // Hydration mismatch fix
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="modules">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {modules.map((module, index) => (
                            <Draggable key={module.id} draggableId={module.id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="flex items-center gap-x-2 bg-white border border-slate-200 text-slate-700 rounded-md mb-4 text-sm"
                                    >
                                        <div
                                            {...provided.dragHandleProps}
                                            className="px-2 py-3 border-r border-r-slate-200 hover:bg-slate-100 rounded-l-md transition"
                                        >
                                            <GripVertical className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 px-2 font-medium">
                                            {module.title}
                                        </div>
                                        <div className="ml-auto pr-2 flex items-center gap-x-2">
                                            {/* We will add Edit / Delete actions later */}
                                            <Pencil className="w-4 h-4 cursor-pointer hover:text-blue-600" />
                                            <Trash2 className="w-4 h-4 cursor-pointer hover:text-red-600" />
                                        </div>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};
