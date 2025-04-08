
import React, { useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { initScripts } from '../utils/d3Helpers';
import Header from '../components/Header';
import WorldMap from '../components/WorldMap';
import EnquetesSection from '../components/EnquetesSection';
import TopicsSection from '../components/TopicsSection';
import DetailedAnalysisSection from '../components/DetailedAnalysisSection';
import RelationsGraphSection from '../components/RelationsGraphSection';
import AnnotationsSection from '../components/AnnotationsSection';

const Index = () => {
  // Initialisation des scripts externes
  useEffect(() => {
    const loadAndInitialize = async () => {
      await initScripts();
    };
    loadAndInitialize();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 bg-[#f7f9fc]">
      {/* Header avec design moderne */}
      <Header />

      {/* Section Carte du Monde */}
      <section className="mb-12" style={{ "--index": "0" } as React.CSSProperties}>
        <div className="overflow-hidden border-none shadow-md bg-white rounded-lg">
          <div className="p-6">
            <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Cartographie des Artist Run Spaces
            </h2>
            <WorldMap />
          </div>
        </div>
      </section>

      {/* Section Enquête */}
      <section className="mb-12" style={{ "--index": "1" } as React.CSSProperties}>
        <EnquetesSection />
      </section>

      {/* Section Topics */}
      <section className="mb-12" style={{ "--index": "2" } as React.CSSProperties}>
        <TopicsSection />
      </section>

      {/* Section Analyse détaillée */}
      <section className="mb-12" style={{ "--index": "3" } as React.CSSProperties}>
        <DetailedAnalysisSection />
      </section>

      {/* Section Graphe des Relations */}
      <section className="mb-12" style={{ "--index": "4" } as React.CSSProperties}>
        <RelationsGraphSection />
      </section>
      {/* Section Annotations */}
      <section className="mb-12" style={{ "--index": "5" } as React.CSSProperties}>
        <AnnotationsSection />
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-600 pb-8">
        <Separator className="mb-6" />
        <p>© 2025 Artist Run Spaces — Tous droits réservés</p>
      </footer>
    </div>
  );
};

export default Index;
