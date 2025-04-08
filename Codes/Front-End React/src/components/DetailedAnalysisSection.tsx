import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentsVisualization from './DocumentsVisualization';
import IntertopicDistanceVisualization from './IntertopicDistanceVisualization';
import TopicHierarchyVisualization from './TopicHierarchyVisualization';
import TopicDistributionVisualization from './TopicDistributionVisualization';

const DetailedAnalysisSection = () => {
  // Utiliser un état pour suivre l'onglet actif
  const [activeTab, setActiveTab] = useState("documents");

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
          <FileText className="mr-2 h-6 w-6" />
          Analyse détaillée des topics
        </h2>
        
        <Tabs 
          defaultValue="documents" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="documents">Documents par topic</TabsTrigger>
            <TabsTrigger value="intertopic">Intertopic distance</TabsTrigger>
            <TabsTrigger value="hierarchy">Topic hierarchy</TabsTrigger>
            <TabsTrigger value="distribution">Topic distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === "documents" && <DocumentsVisualization />}
          </TabsContent>
          
          <TabsContent value="intertopic" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === "intertopic" && <IntertopicDistanceVisualization />}
          </TabsContent>
          
          <TabsContent value="hierarchy" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === "hierarchy" && <TopicHierarchyVisualization />}
          </TabsContent>
          
          <TabsContent value="distribution" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === "distribution" && <TopicDistributionVisualization />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DetailedAnalysisSection;