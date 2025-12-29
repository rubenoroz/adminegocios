"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar, Loader2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: string;
    priority: string;
    createdAt: string;
}

interface SchoolEvent {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
}

export function ParentCommunicationFeed() {
    const [data, setData] = useState<{ announcements: Announcement[], events: SchoolEvent[] }>({ announcements: [], events: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/parents/communication");
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (error) {
                console.error("Error fetching communication:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    if (data.announcements.length === 0 && data.events.length === 0) {
        return null; // Don't show if empty
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Announcements */}
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Megaphone className="h-5 w-5 text-blue-600" />
                        Avisos Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {data.announcements.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay avisos nuevos.</p>
                    ) : (
                        data.announcements.map(ann => (
                            <div key={ann.id} className="border-b pb-3 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm">{ann.title}</h4>
                                    {ann.priority === "HIGH" && (
                                        <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5">Urgente</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-1">{ann.content}</p>
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(ann.createdAt), "d MMM, yyyy", { locale: es })}
                                </p>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Events */}
            <Card className="border-l-4 border-l-green-500 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-green-600" />
                        Próximos Eventos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {data.events.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay eventos próximos.</p>
                    ) : (
                        data.events.map(evt => (
                            <div key={evt.id} className="flex gap-3 items-start border-b pb-3 last:border-0 last:pb-0">
                                <div className="flex flex-col items-center bg-gray-100 rounded p-1.5 min-w-[50px]">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                        {format(new Date(evt.startDate), "MMM", { locale: es })}
                                    </span>
                                    <span className="text-lg font-bold text-gray-800 leading-none">
                                        {format(new Date(evt.startDate), "d")}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">{evt.title}</h4>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(evt.startDate), "HH:mm")}
                                        </div>
                                        {evt.location && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {evt.location}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
