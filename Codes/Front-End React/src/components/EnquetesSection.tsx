import React, { useEffect, useState } from 'react';
import { PieChart, Users, TrendingUp, Database, CheckCircle } from 'lucide-react';
import PieChartComponent from './PieChart';
import { Card, CardContent } from "@/components/ui/card";

// Interface pour les statistiques des réponses
interface ResponseStats {
  "Répondu": number;
  "Sans réponse": number;
  total?: number;
  percentage_repondu?: number;
  percentage_sans_reponse?: number;
}

const EnquetesSection = () => {
  const [responseStats, setResponseStats] = useState<ResponseStats | null>(null);
  const [totalSpaces, setTotalSpaces] = useState<number>(330); // Valeur par défaut basée sur vos données

  useEffect(() => {
    const loadResponseStats = async () => {
      try {
        // Tenter de charger les données depuis le fichier JSON généré par Python
        // Remplacez le chemin par l'emplacement réel de votre fichier
        const response = await fetch('/data/reponses_stats.json');
        
        if (response.ok) {
          const data = await response.json();
          
          // Calculer les pourcentages
          const total = data["Répondu"] + data["Sans réponse"];
          const percentage_repondu = ((data["Répondu"] / total) * 100).toFixed(1);
          const percentage_sans_reponse = ((data["Sans réponse"] / total) * 100).toFixed(1);
          
          setResponseStats({
            ...data,
            total,
            percentage_repondu: parseFloat(percentage_repondu),
            percentage_sans_reponse: parseFloat(percentage_sans_reponse)
          });
          setTotalSpaces(total);
        } else {
          // En cas d'erreur, utiliser des données par défaut ou calculées
          console.warn('Impossible de charger les statistiques des réponses');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    };

    loadResponseStats();
  }, []);

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
          <Users className="mr-2 h-6 w-6" />
          Enquête auprès des Espaces
        </h2>
        
        {/* Section de statistiques générales */}
        <div className="mb-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Statistiques de l'enquête
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total des espaces</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSpaces}</p>
                </div>
              </div>
            </div>
            
            {responseStats && (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Ont répondu</p>
                      <p className="text-2xl font-bold text-green-600">{responseStats["Répondu"]}</p>
                      <p className="text-sm text-gray-500">({responseStats.percentage_repondu}%)</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Sans réponse</p>
                      <p className="text-2xl font-bold text-red-600">{responseStats["Sans réponse"]}</p>
                      <p className="text-sm text-gray-500">({responseStats.percentage_sans_reponse}%)</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6 text-sm text-gray-600">
            <p>
              <strong>Note:</strong> Les données analysées portent sur {totalSpaces} espaces uniques. 
              Cette enquête vise à comprendre comment ces espaces fonctionnent et se conçoivent 
              dans leur contexte actuel.
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Question 1</h3>
              <p className="text-gray-600">
                Pouvez-vous nous apporter un témoignage sur la façon dont votre structure répond, 
                à travers ses modalités de fonctionnement, au contexte actuel et/ou celui de son émergence ?
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Question 2</h3>
              <p className="text-gray-600">
                Pensez-vous que votre espace ou l'espace auquel vous avez participé puisse être 
                considéré comme une œuvre ? Et si oui, en quel sens ?
              </p>
            </div>
            
            {/* Nouvelle section avec méthodologie */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Méthodologie</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• <strong>Période de collecte:</strong> Enquête menée auprès d'espaces artistiques</p>
                <p>• <strong>Échantillon:</strong> {totalSpaces} espaces uniques identifiés</p>
                <p>• <strong>Critères:</strong> Espaces ayant répondu à au moins une des deux questions</p>
                <p>• <strong>Traitement:</strong> Textes nettoyés et analysés automatiquement</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center justify-center">
                <PieChart className="mr-2 h-5 w-5" />
                Répartition des réponses
              </h3>
              <PieChartComponent />
              
              {responseStats && (
                <div className="mt-6 text-sm text-gray-600">
                  <p>
                    Sur les {responseStats.total} espaces contactés, {responseStats["Répondu"]} 
                    ont fourni au moins une réponse, soit un taux de participation de {responseStats.percentage_repondu}%.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer avec informations complémentaires */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Objectifs de l'enquête</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Comprendre les modalités de fonctionnement des espaces artistiques</li>
                <li>Explorer la notion d'espace comme œuvre d'art</li>
                <li>Analyser les réponses contextuelles des structures</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Données collectées</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Témoignages sur les modalités de fonctionnement</li>
                <li>Réflexions sur la conception de l'espace comme œuvre</li>
                <li>Informations géographiques et organisationnelles</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnquetesSection;