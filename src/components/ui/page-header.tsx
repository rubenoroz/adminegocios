import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
}

export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {icon && (
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{
                                background: "linear-gradient(135deg, var(--primary-500)15, var(--primary-500)05)",
                                color: "var(--primary-600)"
                            }}
                        >
                            {icon}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-1" style={{ color: "var(--muted-text)", fontSize: "14px" }}>
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {action && <div>{action}</div>}
            </div>
        </div>
    );
}
