import React, { useState } from 'react';
import { Book } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopicsVisualization from './TopicsVisualization';
import TopicsDistribution from './TopicsDistribution';

const TopicsSection = () => {
  // Utiliser un état pour suivre l'onglet actif
  const [activeTab, setActiveTab] = useState("visualization");

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
          <Book className="mr-2 h-6 w-6" />
          Extraction et répartition des topics
        </h2>
        
        <Tabs 
          defaultValue="visualization" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="visualization">Visualisation des Topics</TabsTrigger>
            <TabsTrigger value="distribution">Distribution par Espaces</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualization" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {/* Rendre conditionnellement pour éviter les problèmes de chargement multiple */}
            {activeTab === "visualization" && <TopicsVisualization />}
          </TabsContent>
          
          <TabsContent value="distribution" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {/* Rendre conditionnellement pour éviter les problèmes de chargement multiple */}
            {activeTab === "distribution" && <TopicsDistribution />}
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Le graphique interactif de type Sunburst te permet de visualiser la répartition des topics dans tes données, avec des informations sur le nombre de documents par topic et les mots-clés associés.</li>
            <li>Barplot est créé pour visualiser la répartition des topics, en termes de pourcentage de documents associés à chaque topic.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicsSection;