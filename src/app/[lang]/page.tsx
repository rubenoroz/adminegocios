import { Hero } from "@/components/landing/hero";
import { DiagnosisForm } from "@/components/landing/diagnosis-form";
import { Features } from "@/components/landing/features";
import { getDictionary } from "@/lib/dictionaries";
import { LanguageSelector } from "@/components/language-selector";
import { Navbar } from "@/components/landing/navbar";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  console.log("Home Page Lang:", lang);
  const dict = await getDictionary(lang as any);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Navbar dict={dict.landing.nav} />
      <Hero dict={dict.landing.hero} />
      <DiagnosisForm dict={dict.landing.diagnosis} />
      <Features dict={dict.landing.features} />
      <footer className="w-full py-6 flex flex-col items-center gap-4 text-sm text-muted-foreground border-t">
        <LanguageSelector />
        <p>{dict.landing.footer.rights}</p>
      </footer>
    </main>
  );
}
