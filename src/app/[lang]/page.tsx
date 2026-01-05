import { Hero } from "@/components/landing/hero";
import { DiagnosisForm } from "@/components/landing/diagnosis-form";
import { FaqSection } from "@/components/landing/faq-section";
import { Features } from "@/components/landing/features";
import { getDictionary } from "@/lib/dictionaries";
import { Navbar } from "@/components/landing/navbar";
import Link from "next/link";
import { PricingSection } from "@/components/landing/pricing-section";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  console.log('Landing Page PARAMS lang:', lang);
  const dict = await getDictionary(lang as any);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0a0f0d, #0d1510, #0a0f0d)',
      color: '#f1f5f9'
    }}>
      <Navbar dict={dict.landing.nav} lang={lang} />
      <Hero dict={dict.landing.hero} lang={lang} />
      <Features dict={dict.landing.features} />
      <PricingSection />
      <DiagnosisForm dict={dict.landing.diagnosis} />
      <FaqSection />

      {/* Footer */}
      <footer style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '40px',
        borderTop: '1px solid #1e3329'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <img src="/logo-footer.svg" alt="ADMNegocios" style={{ height: '32px' }} />
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#94a3b8' }}>
            <Link href="#">Privacidad</Link>
            <Link href="#">Términos</Link>
            <Link href="#">Contacto</Link>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            © 2025 ADMNegocios. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
