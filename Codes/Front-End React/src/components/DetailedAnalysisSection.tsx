import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IntertopicDistanceVisualization from './IntertopicDistanceVisualization';
import TopicHierarchyVisualization from './TopicHierarchyVisualization';
import TopicDistributionVisualization from './TopicDistributionVisualization';
import TopicSimilarityHeatmap from './TopicSimilarityHeatmap';

const DetailedAnalysisSection = () => {
  // Utiliser "intertopic" comme onglet par défaut (premier dans la liste)
  const [activeTab, setActiveTab] = useState("intertopic");

  // Effet pour assurer le chargement correct au démarrage
  useEffect(() => {
    // Forcer le chargement initial de la visualisation
    const timer = setTimeout(() => {
      // S'assurer que l'onglet actif est correctement défini
      setActiveTab("intertopic");
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
          <FileText className="mr-2 h-6 w-6" />
          Analyse détaillée des topics
        </h2>
        
        <Tabs 
          defaultValue="intertopic"  // Définir sur une valeur valide
          value={activeTab}  // Contrôler explicitement l'onglet actif
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="intertopic">Intertopic distance</TabsTrigger>
            <TabsTrigger value="hierarchy">Topic hierarchy</TabsTrigger>
            <TabsTrigger value="distribution">Topic distribution</TabsTrigger>
            <TabsTrigger value="similarity">Similarité entre Topics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="intertopic" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === "intertopic" && <IntertopicDistanceVisualization />}
          </TabsContent>
          
          <TabsContent value="hierarchy" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === "hierarchy" && <TopicHierarchyVisualization />}
          </TabsContent>
          
          <TabsContent value="distribution" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === "distribution" && <TopicDistributionVisualization />}
          </TabsContent>

          <TabsContent value="similarity" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === "similarity" && <TopicSimilarityHeatmap />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DetailedAnalysisSection;