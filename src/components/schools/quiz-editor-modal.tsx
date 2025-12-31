"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { FileQuestion, Plus, Trash2, Check, Save, GripVertical } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
    id?: string;
    text: string;
    options: string[];
    correctAnswer: string;
    points: number;
}

interface QuizEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moduleId: string;
    quiz: {
        id: string;
        title: string;
    } | null;
    onSaved: () => void;
}

export function QuizEditorModal({
    open,
    onOpenChange,
    moduleId,
    quiz,
    onSaved,
}: QuizEditorModalProps) {
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (quiz && open) {
            setTitle(quiz.title);
            fetchQuestions();
        } else {
            setTitle("");
            setQuestions([]);
        }
    }, [quiz, open]);

    const fetchQuestions = async () => {
        if (!quiz) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/quizzes/${quiz.id}/questions`);
            const data = await res.json();
            // Parse options from JSON string
            const parsed = data.map((q: any) => ({
                ...q,
                options: JSON.parse(q.options),
            }));
            setQuestions(parsed);
        } catch (error) {
            console.error("Error fetching questions:", error);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                text: "",
                options: ["", "", "", ""],
                correctAnswer: "0",
                points: 1,
            },
        ]);
    };

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], ...updates };
        setQuestions(updated);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...questions];
        updated[questionIndex].options[optionIndex] = value;
        setQuestions(updated);
    };

    const removeQuestion = async (index: number) => {
        const question = questions[index];
        if (question.id) {
            try {
                await fetch(`/api/quizzes/${quiz?.id}/questions?questionId=${question.id}`, {
                    method: "DELETE",
                });
            } catch (error) {
                console.error("Error deleting question:", error);
                toast({ title: "Error al eliminar pregunta", variant: "destructive" });
                return;
            }
        }
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!quiz) return;
        setSaving(true);

        try {
            // Update quiz title
            await fetch(`/api/modules/${moduleId}/quizzes?quizId=${quiz.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });

            // Save questions
            for (const question of questions) {
                const payload = {
                    text: question.text,
                    options: question.options,
                    correctAnswer: question.correctAnswer,
                    points: question.points,
                };

                if (question.id) {
                    // Update existing
                    await fetch(`/api/quizzes/${quiz.id}/questions?questionId=${question.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                } else {
                    // Create new
                    const res = await fetch(`/api/quizzes/${quiz.id}/questions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                    const created = await res.json();
                    question.id = created.id;
                }
            }

            toast({ title: "Cuestionario guardado exitosamente" });
            onSaved();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving quiz:", error);
            toast({ title: "Error al guardar el cuestionario", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileQuestion className="h-5 w-5 text-purple-500" />
                        Editar Cuestionario
                    </DialogTitle>
                    <DialogDescription>
                        Agrega preguntas de opción múltiple y marca la respuesta correcta.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Título del cuestionario
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Examen del Módulo 1"
                            className="bg-slate-50"
                        />
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-slate-700">
                                Preguntas ({questions.length})
                            </h3>
                            <Button variant="outline" size="sm" onClick={addQuestion}>
                                <Plus className="h-4 w-4 mr-1" />
                                Agregar pregunta
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-slate-400">
                                Cargando preguntas...
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
                                <FileQuestion className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm">
                                    No hay preguntas aún
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={addQuestion}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Agregar primera pregunta
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((question, qIndex) => (
                                    <div
                                        key={qIndex}
                                        className="bg-slate-50 border border-slate-200 rounded-lg p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <GripVertical size={16} />
                                                <span className="text-xs font-bold">
                                                    PREGUNTA {qIndex + 1}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={question.points}
                                                    onChange={(e) =>
                                                        updateQuestion(qIndex, {
                                                            points: parseInt(e.target.value) || 1,
                                                        })
                                                    }
                                                    className="w-16 h-8 text-xs text-center"
                                                />
                                                <span className="text-xs text-slate-400">pts</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                    onClick={() => removeQuestion(qIndex)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>

                                        <Input
                                            value={question.text}
                                            onChange={(e) =>
                                                updateQuestion(qIndex, { text: e.target.value })
                                            }
                                            placeholder="Escribe la pregunta..."
                                            className="mb-3 bg-white"
                                        />

                                        <RadioGroup
                                            value={question.correctAnswer}
                                            onValueChange={(v) =>
                                                updateQuestion(qIndex, { correctAnswer: v })
                                            }
                                            className="space-y-2"
                                        >
                                            {question.options.map((option, oIndex) => (
                                                <div
                                                    key={oIndex}
                                                    className="flex items-center gap-2"
                                                >
                                                    <RadioGroupItem
                                                        value={oIndex.toString()}
                                                        id={`q${qIndex}-o${oIndex}`}
                                                        className="border-slate-300"
                                                    />
                                                    <Input
                                                        value={option}
                                                        onChange={(e) =>
                                                            updateOption(qIndex, oIndex, e.target.value)
                                                        }
                                                        placeholder={`Opción ${String.fromCharCode(65 + oIndex)}`}
                                                        className="flex-1 h-9 text-sm bg-white"
                                                    />
                                                    {question.correctAnswer === oIndex.toString() && (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    )}
                                                </div>
                                            ))}
                                        </RadioGroup>
                                        <p className="text-xs text-slate-400 mt-2">
                                            Selecciona el círculo de la respuesta correcta
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !title.trim()}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Guardando..." : "Guardar cuestionario"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
