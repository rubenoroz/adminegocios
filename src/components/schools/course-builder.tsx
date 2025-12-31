"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, FileQuestion, ClipboardList, Link as LinkIcon, ChevronDown, ChevronRight, Trash2, Pencil, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { LessonEditorModal } from "./lesson-editor-modal";
import { QuizEditorModal } from "./quiz-editor-modal";

interface CourseBuilderProps {
    courseId: string;
}

export function CourseBuilder({ courseId }: CourseBuilderProps) {
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
    const { toast } = useToast();

    // Item creation state
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [itemType, setItemType] = useState<"LESSON" | "QUIZ" | "ASSIGNMENT" | "RESOURCE">("LESSON");
    const [itemTitle, setItemTitle] = useState("");
    const [itemContent, setItemContent] = useState(""); // For Lesson content or Resource URL
    const [itemDescription, setItemDescription] = useState(""); // For Assignment
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);

    // Lesson editing state
    const [isLessonEditOpen, setIsLessonEditOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<{ id: string; title: string; content: string } | null>(null);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

    // Quiz editing state
    const [isQuizEditOpen, setIsQuizEditOpen] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState<{ id: string; title: string } | null>(null);

    useEffect(() => {
        fetchModules();
    }, [courseId]);

    const fetchModules = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/modules`);
            const data = await res.json();
            setModules(data);
        } catch (error) {
            console.error("Error fetching modules:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;

        if (sourceIndex === destIndex) return;

        // Reorder locally first for instant feedback
        const reorderedModules = Array.from(modules);
        const [movedModule] = reorderedModules.splice(sourceIndex, 1);
        reorderedModules.splice(destIndex, 0, movedModule);

        // Update order property in local state
        const updatedModules = reorderedModules.map((mod, idx) => ({
            ...mod,
            order: idx
        }));
        setModules(updatedModules);

        // Persist to server
        try {
            const orderedIds = updatedModules.map(m => m.id);
            await fetch(`/api/courses/${courseId}/modules/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderedIds }),
            });
            toast({ title: "Orden actualizado" });
        } catch (error) {
            console.error("Error reordering:", error);
            toast({ title: "Error al reordenar", variant: "destructive" });
            fetchModules(); // Revert on error
        }
    };

    const handleAddModule = async () => {
        if (!newModuleTitle) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/modules`, {
                method: "POST",
                body: JSON.stringify({ title: newModuleTitle }),
            });

            if (!res.ok) throw new Error("Failed");

            setNewModuleTitle("");
            setIsAddModuleOpen(false);
            fetchModules();
            toast({ title: "Módulo creado exitosamente" });
        } catch (error) {
            console.error("Error adding module:", error);
            toast({ title: "Error al crear el módulo", variant: "destructive" });
        }
    };

    const handleAddItem = async () => {
        if (!itemTitle || !activeModuleId) return;

        let endpoint = "";
        let body: any = { title: itemTitle };

        switch (itemType) {
            case "LESSON":
                endpoint = "lessons";
                body.content = itemContent;
                break;
            case "QUIZ":
                endpoint = "quizzes";
                break;
            case "ASSIGNMENT":
                endpoint = "assignments";
                body.description = itemDescription;
                break;
            case "RESOURCE":
                endpoint = "resources";
                body.url = itemContent;
                body.type = "LINK"; // Defaulting to LINK for now
                break;
        }

        try {
            const res = await fetch(`/api/modules/${activeModuleId}/${endpoint}`, {
                method: "POST",
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Failed");

            // Reset state
            setItemTitle("");
            setItemContent("");
            setItemDescription("");
            setIsAddItemOpen(false);
            fetchModules();
            toast({ title: "Contenido agregado exitosamente" });
        } catch (error) {
            console.error("Error adding item:", error);
            toast({ title: "Error al agregar contenido", variant: "destructive" });
        }
    };

    const openAddItemModal = (moduleId: string) => {
        setActiveModuleId(moduleId);
        setIsAddItemOpen(true);
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este módulo y todo su contenido?")) return;
        try {
            const res = await fetch(`/api/modules/${moduleId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed");
            fetchModules();
            toast({ title: "Módulo eliminado" });
        } catch (error) {
            console.error("Error deleting module:", error);
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const handleDeleteItem = async (moduleId: string, itemId: string, type: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar esta ${type.toLowerCase()}?`)) return;

        let endpoint = "";
        let param = "";

        switch (type) {
            case "LESSON": endpoint = "lessons"; param = "lessonId"; break;
            case "QUIZ": endpoint = "quizzes"; param = "quizId"; break;
            case "ASSIGNMENT": endpoint = "assignments"; param = "assignmentId"; break;
            case "RESOURCE": endpoint = "resources"; param = "resourceId"; break;
        }

        try {
            const res = await fetch(`/api/modules/${moduleId}/${endpoint}?${param}=${itemId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed");

            fetchModules();
            toast({ title: "Contenido eliminado" });
        } catch (error) {
            console.error("Error deleting item:", error);
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-muted-text">Cargando contenido...</span>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        Estructura del Contenido
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Organiza el plan de estudios en módulos y lecciones</p>
                </div>
                <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
                    <DialogTrigger asChild>
                        <button className="button-modern gradient-blue flex items-center gap-2 py-2 px-6 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
                            <Plus className="h-4 w-4" /> Nuevo Módulo
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Módulo</DialogTitle>
                            <DialogDescription>Los módulos ayudan a organizar las lecciones por temas o semanas.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <label className="text-sm font-medium mb-2 block">Título del Módulo</label>
                            <Input
                                placeholder="Ej: Introducción a la materia"
                                value={newModuleTitle}
                                onChange={(e) => setNewModuleTitle(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddModuleOpen(false)}>Cancelar</Button>
                            <Button onClick={handleAddModule} disabled={!newModuleTitle.trim()}>Crear Módulo</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="modules">
                    {(provided) => (
                        <div
                            className="space-y-6"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {modules.map((module, index) => (
                                <Draggable key={module.id} draggableId={module.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${snapshot.isDragging ? 'border-blue-300 shadow-lg' : 'border-slate-100'}`}
                                        >
                                            <div className="bg-slate-50/50 py-4 px-6 flex items-center justify-between border-b border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm transition-colors"
                                                    >
                                                        <GripVertical className="h-4 w-4" />
                                                    </div>
                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shadow-sm">
                                                        {index + 1}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800">{module.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openAddItemModal(module.id)}
                                                        className="h-9 px-4 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 font-bold text-xs rounded-xl shadow-sm transition-all"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2 inline-block" /> AGREGAR CONTENIDO
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteModule(module.id)}
                                                        className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl shadow-sm transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="bg-white">
                                                <div className="divide-y divide-slate-50">
                                                    {/* Lessons */}
                                                    {module.lessons?.map((lesson: any) => (
                                                        <div key={lesson.id} className="group flex items-center p-4 hover:bg-slate-50 transition-colors pl-8 cursor-pointer"
                                                            onClick={() => {
                                                                setEditingLesson({ id: lesson.id, title: lesson.title, content: lesson.content || "" });
                                                                setEditingModuleId(module.id);
                                                                setIsLessonEditOpen(true);
                                                            }}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-4 text-blue-500 border border-blue-100">
                                                                <BookOpen size={16} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-sm text-slate-700">{lesson.title}</p>
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Lección</p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingLesson({ id: lesson.id, title: lesson.title, content: lesson.content || "" });
                                                                    setEditingModuleId(module.id);
                                                                    setIsLessonEditOpen(true);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteItem(module.id, lesson.id, "LESSON");
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Quizzes */}
                                                    {module.quizzes?.map((quiz: any) => (
                                                        <div key={quiz.id} className="group flex items-center p-4 hover:bg-slate-50 transition-colors pl-8 cursor-pointer"
                                                            onClick={() => {
                                                                setEditingQuiz({ id: quiz.id, title: quiz.title });
                                                                setEditingModuleId(module.id);
                                                                setIsQuizEditOpen(true);
                                                            }}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mr-4 text-purple-500 border border-purple-100">
                                                                <FileQuestion size={16} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-sm text-slate-700">{quiz.title}</p>
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Cuestionario</p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingQuiz({ id: quiz.id, title: quiz.title });
                                                                    setEditingModuleId(module.id);
                                                                    setIsQuizEditOpen(true);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-purple-500 transition-all"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteItem(module.id, quiz.id, "QUIZ");
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Assignments */}
                                                    {module.assignments?.map((assignment: any) => (
                                                        <div key={assignment.id} className="group flex items-center p-4 hover:bg-slate-50 transition-colors pl-8">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mr-4 text-amber-500 border border-amber-100">
                                                                <ClipboardList size={16} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-sm text-slate-700">{assignment.title}</p>
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Tarea</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteItem(module.id, assignment.id, "ASSIGNMENT")}
                                                                className="opacity-0 group-hover:opacity-100 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Resources */}
                                                    {module.resources?.map((resource: any) => (
                                                        <div key={resource.id} className="group flex items-center p-4 hover:bg-slate-50 transition-colors pl-8">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-4 text-emerald-500 border border-emerald-100">
                                                                <LinkIcon size={16} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sm text-slate-700 hover:text-blue-600 transition-colors">
                                                                    {resource.title}
                                                                </a>
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Recurso / Link</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteItem(module.id, resource.id, "RESOURCE")}
                                                                className="opacity-0 group-hover:opacity-100 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {(!module.lessons?.length && !module.quizzes?.length && !module.assignments?.length && !module.resources?.length) && (
                                                        <div className="p-8 text-center text-sm text-slate-400 italic">
                                                            Este módulo no tiene contenido aún.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            {modules.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
                                        <Plus size={36} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">No hay módulos</h3>
                                    <p className="text-slate-500 mb-12 max-w-sm mx-auto text-sm">Comienza estructurando tu curso creando el primer módulo de enseñanza.</p>
                                    <div className="flex justify-center py-4">
                                        <button
                                            onClick={() => setIsAddModuleOpen(true)}
                                            className="button-modern gradient-blue flex items-center gap-2 py-3 px-8 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                                        >
                                            <Plus className="h-5 w-5" />
                                            Crear primer módulo
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Add Item Dialog */}
            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agregar Contenido</DialogTitle>
                        <DialogDescription>Selecciona el tipo de material que deseas añadir al módulo.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text">Tipo de Material</label>
                            <Select value={itemType} onValueChange={(v: any) => setItemType(v)}>
                                <SelectTrigger className="bg-surface/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LESSON">📖 Lección</SelectItem>
                                    <SelectItem value="QUIZ">❓ Cuestionario</SelectItem>
                                    <SelectItem value="ASSIGNMENT">📝 Tarea</SelectItem>
                                    <SelectItem value="RESOURCE">🔗 Recurso / Enlace</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text">Título</label>
                            <Input
                                value={itemTitle}
                                onChange={(e) => setItemTitle(e.target.value)}
                                placeholder="Ej: Fundamentos de la materia"
                                className="bg-surface/50"
                            />
                        </div>

                        {itemType === "LESSON" && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text">Contenido (Markdown)</label>
                                <Textarea
                                    value={itemContent}
                                    onChange={(e) => setItemContent(e.target.value)}
                                    placeholder="Escribe el contenido o pega el HTML..."
                                    rows={8}
                                    className="bg-surface/50 resize-none"
                                />
                            </div>
                        )}

                        {itemType === "ASSIGNMENT" && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text">Instrucciones</label>
                                <Textarea
                                    value={itemDescription}
                                    onChange={(e) => setItemDescription(e.target.value)}
                                    placeholder="Detalla lo que el alumno debe entregar..."
                                    rows={4}
                                    className="bg-surface/50 resize-none"
                                />
                            </div>
                        )}

                        {itemType === "RESOURCE" && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text">URL del Recurso</label>
                                <Input
                                    value={itemContent}
                                    onChange={(e) => setItemContent(e.target.value)}
                                    placeholder="https://ejemplo.com/archivo.pdf"
                                    className="bg-surface/50"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddItem} disabled={!itemTitle.trim()}>
                            Añadir Material
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Lesson Editor Modal */}
            <LessonEditorModal
                open={isLessonEditOpen}
                onOpenChange={setIsLessonEditOpen}
                moduleId={editingModuleId || ""}
                lesson={editingLesson}
                onSaved={fetchModules}
            />
            {/* Quiz Editor Modal */}
            <QuizEditorModal
                open={isQuizEditOpen}
                onOpenChange={setIsQuizEditOpen}
                moduleId={editingModuleId || ""}
                quiz={editingQuiz}
                onSaved={fetchModules}
            />
        </div>
    );
}
