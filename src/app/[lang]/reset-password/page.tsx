import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Suspense } from "react";

function ResetPasswordContent() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <ResetPasswordForm />
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
