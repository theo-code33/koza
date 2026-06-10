import Navbar from '../components/landing/Navbar';
import HeroEnhanced from '../components/landing/HeroEnhanced';
import Features from '../components/landing/Features';
import Benefits from '../components/landing/Benefits';
import FAQ from '../components/landing/FAQ';
import CTAFinal from '../components/landing/CTAFinal';
import Footer from '../components/landing/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="bg-[var(--color-bg)] text-[var(--color-text)]">
        <HeroEnhanced />
        <Features />
        <Benefits />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
