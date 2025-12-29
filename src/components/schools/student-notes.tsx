"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Trash2, MessageSquare, AlertTriangle, Star, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Note {
    id: string;
    content: string;
    type: "OBSERVATION" | "BEHAVIOR" | "ACADEMIC" | "POSITIVE";
    createdAt: string;
    author: {
        name: string | null;
        image: string | null;
    };
    course?: {
        name: string;
    };
}

interface StudentNotesProps {
    studentId: string;
    courseId?: string; // Optional context
}

export function StudentNotes({ studentId, courseId }: StudentNotesProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [content, setContent] = useState("");
    const [type, setType] = useState<string>("OBSERVATION");
    const { toast } = useToast();

    useEffect(() => {
        fetchNotes();
    }, [studentId]);

    const fetchNotes = async () => {
        try {
            const res = await fetch(`/api/students/${studentId}/notes`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/students/${studentId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    type,
                    courseId,
                }),
            });

            if (res.ok) {
                const newNote = await res.json();
                setNotes([newNote, ...notes]);
                setContent("");
                toast({
                    title: "Nota agregada",
                    description: "La observación ha sido registrada correctamente.",
                });
            } else {
                throw new Error("Failed to create note");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar la nota.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (noteId: string) => {
        try {
            const res = await fetch(`/api/notes/${noteId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setNotes(notes.filter((n) => n.id !== noteId));
                toast({
                    title: "Nota eliminada",
                    description: "La nota ha sido eliminada.",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo eliminar la nota.",
                variant: "destructive",
            });
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "BEHAVIOR":
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case "POSITIVE":
                return <Star className="h-4 w-4 text-yellow-500" />;
            case "ACADEMIC":
                return <BookOpen className="h-4 w-4 text-blue-500" />;
            default:
                return <MessageSquare className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "BEHAVIOR":
                return "Alerta de Conducta";
            case "POSITIVE":
                return "Mérito / Positivo";
            case "ACADEMIC":
                return "Académico";
            default:
                return "Observación";
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "BEHAVIOR":
                return "bg-red-100 text-red-800 border-red-200";
            case "POSITIVE":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "ACADEMIC":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Agregar Nota / Observación</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-1/3">
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tipo de nota" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OBSERVATION">Observación General</SelectItem>
                                        <SelectItem value="ACADEMIC">Académico</SelectItem>
                                        <SelectItem value="BEHAVIOR">Alerta de Conducta</SelectItem>
                                        <SelectItem value="POSITIVE">Mérito / Positivo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <Textarea
                                    placeholder="Escribe tu observación aquí..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSubmit} disabled={submitting || !content.trim()}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Nota
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Historial de Observaciones</h3>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg bg-muted/50 text-muted-foreground">
                        No hay notas registradas para este alumno.
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {notes.map((note) => (
                                <div
                                    key={note.id}
                                    className="flex gap-4 p-4 border rounded-lg bg-white shadow-sm"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={note.author.image || ""} />
                                        <AvatarFallback>
                                            {note.author.name?.charAt(0) || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">
                                                    {note.author.name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={getTypeColor(note.type)}
                                                >
                                                    <span className="mr-1">{getTypeIcon(note.type)}</span>
                                                    {getTypeLabel(note.type)}
                                                </Badge>
                                                {note.course && (
                                                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">
                                                        {note.course.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(note.createdAt), {
                                                        addSuffix: true,
                                                        locale: es,
                                                    })}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                    onClick={() => handleDelete(note.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {note.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
}
