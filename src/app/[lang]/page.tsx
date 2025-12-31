import { Hero } from "@/components/landing/hero";
import { DiagnosisForm } from "@/components/landing/diagnosis-form";
import { Features } from "@/components/landing/features";
import { getDictionary } from "@/lib/dictionaries";
import { Navbar } from "@/components/landing/navbar";
import Link from "next/link";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as any);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)',
      color: '#0f172a'
    }}>
      <Navbar dict={dict.landing.nav} />
      <Hero dict={dict.landing.hero} />
      <Features dict={dict.landing.features} />
      <DiagnosisForm dict={dict.landing.diagnosis} />

      {/* Footer simple */}
      <footer style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '40px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            Admnegocios
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#64748b' }}>
            <Link href="#">Privacidad</Link>
            <Link href="#">Términos</Link>
            <Link href="#">Contacto</Link>
          </div>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            © 2024 Admnegocios. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
