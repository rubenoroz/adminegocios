"use client";

import { useState, useEffect } from "react";
import { useBranding } from "@/context/branding-context";
import { Upload, Check, AlertCircle, Palette, Image as ImageIcon, Type, Sparkles } from "lucide-react";
import Image from "next/image";

// Paletas de colores predefinidas para escuelas
const COLOR_PRESETS = [
    { name: "Clásico Azul", primary: "#2563EB", sidebar: "#1E3A8A" },
    { name: "Esmeralda", primary: "#059669", sidebar: "#064E3B" },
    { name: "Púrpura Real", primary: "#7C3AED", sidebar: "#4C1D95" },
    { name: "Rojo Institucional", primary: "#DC2626", sidebar: "#7F1D1D" },
    { name: "Naranja Energía", primary: "#EA580C", sidebar: "#7C2D12" },
    { name: "Rosa Moderno", primary: "#DB2777", sidebar: "#831843" },
    { name: "Cian Tecnología", primary: "#0891B2", sidebar: "#164E63" },
    { name: "Gris Ejecutivo", primary: "#475569", sidebar: "#1E293B" },
];

export function BrandingSettings() {
    const { logoUrl, primaryColor, sidebarColor, logoHeight, updateLogo, updateColors } = useBranding();
    const [tempPrimaryColor, setTempPrimaryColor] = useState(primaryColor);
    const [tempSidebarColor, setTempSidebarColor] = useState(sidebarColor);
    const [tempLogoHeight, setTempLogoHeight] = useState(logoHeight);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [savingColors, setSavingColors] = useState(false);

    useEffect(() => {
        setTempPrimaryColor(primaryColor);
        setTempSidebarColor(sidebarColor);
        setTempLogoHeight(logoHeight);
    }, [primaryColor, sidebarColor, logoHeight]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage("");
        setError("");

        try {
            await updateLogo(file);
            setMessage("Logotipo actualizado correctamente");
            setTimeout(() => setMessage(""), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveColors = async () => {
        setSavingColors(true);
        setMessage("");
        setError("");

        try {
            await updateColors({
                primaryColor: tempPrimaryColor,
                sidebarColor: tempSidebarColor,
                logoHeight: tempLogoHeight
            });
            setMessage("Configuración guardada correctamente");
            setTimeout(() => setMessage(""), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSavingColors(false);
        }
    };

    const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setTempPrimaryColor(preset.primary);
        setTempSidebarColor(preset.sidebar);
    };

    return (
        <div className="space-y-8">
            {/* Mensajes de estado */}
            {message && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#D1FAE5',
                        border: '1px solid #A7F3D0',
                        color: '#047857'
                    }}
                >
                    <Check style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 500 }}>{message}</span>
                </div>
            )}
            {error && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#FEE2E2',
                        border: '1px solid #FECACA',
                        color: '#DC2626'
                    }}
                >
                    <AlertCircle style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: 500 }}>{error}</span>
                </div>
            )}

            {/* Sección: Logotipo */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#DBEAFE',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <ImageIcon style={{ width: '20px', height: '20px', color: '#2563EB' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Logotipo</h3>
                        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>El logo de tu institución aparecerá en el menú</p>
                    </div>
                </div>

                <div style={{
                    border: '2px dashed #CBD5E1',
                    borderRadius: '16px',
                    padding: '32px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    marginBottom: '20px'
                }}>
                    {logoUrl ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '100px'
                            }}
                        >
                            <Image
                                src={logoUrl}
                                alt="Logo Preview"
                                width={200}
                                height={tempLogoHeight}
                                style={{
                                    width: 'auto',
                                    height: `${tempLogoHeight}px`,
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                }}
                                unoptimized={logoUrl.endsWith('.svg')}
                            />
                        </div>
                    ) : (
                        <div>
                            <Upload style={{ width: '48px', height: '48px', color: '#94A3B8', margin: '0 auto 12px' }} />
                            <p style={{ color: '#64748B', fontSize: '14px' }}>Aún no has subido un logotipo</p>
                        </div>
                    )}
                </div>

                {/* Slider de tamaño */}
                {logoUrl && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>Tamaño del logo</span>
                            <span style={{
                                fontSize: '14px',
                                color: '#2563EB',
                                fontWeight: 600,
                                backgroundColor: '#EFF6FF',
                                padding: '2px 8px',
                                borderRadius: '4px'
                            }}>{tempLogoHeight}px</span>
                        </div>
                        <input
                            type="range"
                            min={32}
                            max={250}
                            step={4}
                            value={tempLogoHeight}
                            onChange={(e) => {
                                const newValue = Number(e.target.value);
                                console.log("Slider changed to:", newValue);
                                setTempLogoHeight(newValue);
                            }}
                            style={{
                                width: '100%',
                                height: '8px',
                                cursor: 'pointer',
                                accentColor: '#2563EB'
                            }}
                        />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '4px',
                            fontSize: '11px',
                            color: '#94A3B8'
                        }}>
                            <span>32px</span>
                            <span>250px</span>
                        </div>
                    </div>
                )}

                {/* Botón subir */}
                <label
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#2563EB',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: uploading ? 'wait' : 'pointer',
                        opacity: uploading ? 0.7 : 1
                    }}
                >
                    <Upload style={{ width: '16px', height: '16px' }} />
                    {uploading ? "Subiendo..." : "Subir Logotipo"}
                    <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                </label>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
                    Formatos: PNG, JPG, SVG. Recomendado: fondo transparente
                </p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '32px 0' }} />

            {/* Sección: Colores */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#F3E8FF',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Palette style={{ width: '20px', height: '20px', color: '#7C3AED' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Colores del Tema</h3>
                        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Personaliza la apariencia de tu sistema</p>
                    </div>
                </div>

                {/* Paletas predefinidas */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Sparkles style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Paletas Sugeridas</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {COLOR_PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: tempPrimaryColor === preset.primary ? '2px solid #2563EB' : '1px solid #E2E8F0',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '8px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: preset.primary }} />
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: preset.sidebar }} />
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{preset.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selectores de color */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>
                            Color Primario
                        </label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={tempPrimaryColor}
                                onChange={(e) => setTempPrimaryColor(e.target.value)}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '8px',
                                    border: '2px solid #E2E8F0',
                                    cursor: 'pointer',
                                    padding: '2px'
                                }}
                            />
                            <input
                                type="text"
                                value={tempPrimaryColor}
                                onChange={(e) => setTempPrimaryColor(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    fontSize: '14px',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>
                            Color del Menú
                        </label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={tempSidebarColor}
                                onChange={(e) => setTempSidebarColor(e.target.value)}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '8px',
                                    border: '2px solid #E2E8F0',
                                    cursor: 'pointer',
                                    padding: '2px'
                                }}
                            />
                            <input
                                type="text"
                                value={tempSidebarColor}
                                onChange={(e) => setTempSidebarColor(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    fontSize: '14px',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Vista previa */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#475569', marginBottom: '12px' }}>
                        Vista Previa
                    </label>
                    <div style={{
                        display: 'flex',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            width: '80px',
                            padding: '20px 12px',
                            backgroundColor: tempSidebarColor,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                            <div style={{ width: '32px', height: '6px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '3px' }} />
                            <div style={{ width: '32px', height: '6px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '3px' }} />
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#F8FAFC', padding: '20px' }}>
                            <div style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                backgroundColor: tempPrimaryColor,
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600
                            }}>
                                Botón de Ejemplo
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón guardar */}
                <button
                    onClick={handleSaveColors}
                    disabled={savingColors}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: savingColors ? 'wait' : 'pointer',
                        opacity: savingColors ? 0.7 : 1
                    }}
                >
                    {savingColors ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
        </div>
    );
}
