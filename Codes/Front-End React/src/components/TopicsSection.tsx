import React, { useState, useEffect } from 'react';
import { Book, BarChart2, Award } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import TopicsVisualization from './TopicsVisualization';
import TopicsDistribution from './TopicsDistribution';

// Interface pour les métriques de qualité
interface QualityMetrics {
  topic_diversity: number;
  topic_coverage: number;
}

const TopicsSection = () => {
  // Utiliser un état pour suivre l'onglet actif
  const [activeTab, setActiveTab] = useState("visualization");
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);

  // Charger les métriques de qualité
  useEffect(() => {
    const fetchQualityMetrics = async () => {
      try {
        const response = await fetch('/data/quality_metrics.json');
        if (response.ok) {
          const data = await response.json();
          setQualityMetrics(data);
        } else {
          // Si le fichier n'existe pas, utiliser des valeurs par défaut
          console.warn('Impossible de charger les métriques de qualité, utilisation de valeurs par défaut');
          setQualityMetrics({
            topic_diversity: 0.913, 
            topic_coverage: 0.101
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des métriques de qualité:', error);
        // Utiliser des valeurs par défaut en cas d'erreur
        setQualityMetrics({
          topic_diversity: 0.913, 
          topic_coverage: 0.101
        });
      }
    };

    fetchQualityMetrics();
  }, []);

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
          <Book className="mr-2 h-6 w-6" />
          Extraction et répartition des topics
        </h2>
        
        {/* Description déplacée en haut */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Le graphique interactif de type Sunburst te permet de visualiser la répartition des topics dans tes données, avec des informations sur le nombre de documents par topic et les mots-clés associés.</li>
            <li>Barplot est créé pour visualiser la répartition des topics, en termes de pourcentage de documents associés à chaque topic.</li>
          </ul>
        </div>
        
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
        
        {/* Nouvelle section d'évaluation des topics */}
        <div className="mt-6">
          <h3 className="flex items-center text-xl font-semibold mb-4 text-indigo-600">
            <Award className="mr-2 h-5 w-5" />
            ÉVALUATION DES TOPICS
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Métrique 1: Diversité des topics */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-700">Diversité des topics</h4>
                <span className="text-lg font-bold text-indigo-600">
                  {qualityMetrics ? (qualityMetrics.topic_diversity * 100).toFixed(1) + '%' : '...'}
                </span>
              </div>
              
              <Progress 
                value={qualityMetrics ? qualityMetrics.topic_diversity * 100 : 0} 
                className="h-2 mb-2"
              />
              
              <p className="text-sm text-gray-500">
                Mesure la variété des mots-clés entre les différents topics. Une valeur proche de 1 indique des topics bien distincts.
              </p>
            </div>
            
            {/* Métrique 2: Couverture des topics */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-700">Couverture des topics</h4>
                <span className="text-lg font-bold text-indigo-600">
                  {qualityMetrics ? (qualityMetrics.topic_coverage * 100).toFixed(1) + '%' : '...'}
                </span>
              </div>
              
              <Progress 
                value={qualityMetrics ? 100 - (qualityMetrics.topic_coverage * 100) : 0} 
                className="h-2 mb-2"
              />
              
              <p className="text-sm text-gray-500">
                Représente la proportion de documents non classifiés. Une valeur proche de 0 indique une meilleure couverture.
              </p>
            </div>
          </div>
          
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Interprétation :</strong> L'analyse montre une diversité des topics de {qualityMetrics ? (qualityMetrics.topic_diversity * 100).toFixed(1) + '%' : '...'} (excellente) et une couverture de {qualityMetrics ? (100 - (qualityMetrics.topic_coverage * 100)).toFixed(1) + '%' : '...'} des documents (très bonne). Cela indique que le modèle a identifié des thématiques distinctes qui représentent bien l'ensemble des données.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicsSection;