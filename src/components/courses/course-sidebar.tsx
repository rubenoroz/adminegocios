
"use client";

import { ModuleList } from "./module-list";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CourseSidebarProps {
    course: any; // Full course object with included modules
}

export const CourseSidebar = ({ course }: CourseSidebarProps) => {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);

    // Simple create handler (can be moved to a modal later)
    const onCreateModule = async () => {
        const title = prompt("Nombre del nuevo módulo:");
        if (!title) return;

        try {
            setIsCreating(true);
            const res = await fetch(`/api/courses/${course.id}/modules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title })
            });

            if (res.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm w-80 fixed left-64 top-16 bottom-0 z-20">
            {/* Note: positioning (left-64) depends on your main sidebar width. 
                 If you use a layout with a main sidebar, this is a secondary sidebar.
                 For now, let's assume it sits inside a flex container in layout.tsx 
                 so we might remove 'fixed' and let layout handle it.
                 Let's keep it simple relative sizing.
             */}
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-sm uppercase text-slate-500">
                    Contenido del Curso
                </h2>
                <button
                    onClick={onCreateModule}
                    disabled={isCreating}
                    className="p-1 hover:bg-slate-100 rounded-sm transition"
                    title="Crear Módulo"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 p-2">
                <ModuleList items={course.modules || []} courseId={course.id} />
            </div>
        </div>
    );
};
