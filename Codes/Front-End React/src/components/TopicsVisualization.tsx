import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { InfoIcon, BuildingIcon, TagIcon, BookOpenIcon, Users2Icon, ChevronDownIcon } from "lucide-react";

// Importation directe des fichiers JSON
import hybridTopicsData from '../data/hybrid_topics.json';
import topicAnalysisData from '../data/topic_analysis.json';
import topicsSpacesData from '../data/topics_spaces.json';

interface TopicData {
  id: number;
  keywords: string[];
  summary: string;
  count: number;
  spaces: string[];
}

const TopicsVisualization = () => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topicData, setTopicData] = useState<TopicData[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicData | null>(null);
  const [displayedRows, setDisplayedRows] = useState<number>(5); // Nombre de lignes à afficher
  const [maxDisplayedRows, setMaxDisplayedRows] = useState<number>(5); // Maximum de lignes affichées
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef<boolean>(false);

  useEffect(() => {
    // Si déjà initialisé, ne pas refaire le chargement pour éviter la duplication
    if (hasInitialized.current) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Charger le contenu HTML de la visualisation
        const htmlResponse = await fetch('/topic_mapping.html');
        
        if (!htmlResponse.ok) {
          throw new Error(`Erreur HTTP: ${htmlResponse.status}`);
        }
        
        const htmlData = await htmlResponse.text();
        
        if (htmlData.length === 0) {
          throw new Error('Le fichier HTML est vide');
        }
        
        setHtmlContent(htmlData);
        
        // Utiliser les données JSON importées directement
        try {
          // Combiner les données pour avoir les informations complètes
          const combinedData: TopicData[] = [];
          
          // Parcourir les données d'analyse pour les counts
          for (const topic in topicAnalysisData) {
            const topicId = parseInt(topic);
            if (topicId !== -1 && hybridTopicsData[topic]) { // Exclure les outliers
              combinedData.push({
                id: topicId,
                keywords: hybridTopicsData[topic].keywords || [],
                summary: hybridTopicsData[topic].summary || "Aucun résumé disponible.",
                count: topicAnalysisData[topic].texte || 0,
                spaces: topicsSpacesData[topic] || []
              });
            }
          }
          
          setTopicData(combinedData);
          // Définir le nombre initial de lignes affichées
          setDisplayedRows(5);
          setMaxDisplayedRows(5);
        } catch (dataError) {
          console.warn('Erreur lors du traitement des données des topics:', dataError);
          // On continue même sans les données enrichies
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Erreur de chargement de topic_mapping.html :', error);
        setError(`Impossible de charger la visualisation des topics: ${error.message}`);
        setIsLoading(false);
        
        toast({
          title: "Erreur de chargement",
          description: error.message || "Une erreur s'est produite",
          variant: "destructive",
        });
      }
    };
    
    fetchData();
    hasInitialized.current = true;
    
    return () => {
      console.log('Nettoyage du composant TopicsVisualization');
      hasInitialized.current = false;
    };
  }, [toast]);

  // Utiliser un useEffect séparé pour gérer l'exécution des scripts
  useEffect(() => {
    if (!isLoading && !error && htmlContent && containerRef.current) {
      console.log('Préparation à l\'exécution des scripts de la visualisation');
      
      try {
        // Nettoyage préventif du conteneur avant d'ajouter du nouveau contenu
        if (containerRef.current) {
          const existingScripts = containerRef.current.querySelectorAll('script');
          existingScripts.forEach(script => script.remove());
        }
        
        // Récupérer tous les scripts depuis le contenu HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const scripts = Array.from(doc.querySelectorAll('script'));
        
        // Ajouter le contenu HTML (modifié)
        containerRef.current.innerHTML = htmlContent;
        
        // Ajouter l'écouteur d'événements pour capturer les clics sur les segments
        setTimeout(() => {
          const paths = containerRef.current?.querySelectorAll('path.sunburst-path');
          if (paths) {
            paths.forEach(path => {
              path.addEventListener('click', (e) => {
                // Récupérer l'ID du topic depuis l'attribut data
                const target = e.target as SVGPathElement;
                const topicId = target.getAttribute('data-id') || target.getAttribute('data-name');
                if (topicId) {
                  // Extraire l'ID numérique du topic
                  const numericId = parseInt(topicId.replace('Topic ', ''));
                  if (!isNaN(numericId)) {
                    // Trouver les données du topic
                    const topic = topicData.find(t => t.id === numericId);
                    if (topic) {
                      setSelectedTopic(topic);
                    }
                  }
                }
              });
            });
          }
        }, 1000);
        
        // Exécuter les scripts dans l'ordre
        scripts.forEach((originalScript) => {
          const script = document.createElement('script');
          
          // Copier tous les attributs du script original
          Array.from(originalScript.attributes).forEach(attr => {
            script.setAttribute(attr.name, attr.value);
          });
          
          // Gérer le contenu du script
          if (originalScript.innerHTML) {
            script.innerHTML = originalScript.innerHTML;
          }
          
          // Ajouter le script au conteneur
          containerRef.current?.appendChild(script);
        });
        
        console.log('Scripts de visualisation exécutés');
        
        // Vérifier si le rendu a bien fonctionné
        setTimeout(() => {
          if (containerRef.current && containerRef.current.children.length <= scripts.length) {
            console.log('Le conteneur semble ne pas avoir rendu correctement la visualisation');
            toast({
              title: "Attention",
              description: "La visualisation pourrait ne pas s'être correctement chargée",
              variant: "default",
            });
          } else {
            console.log('Visualisation rendue avec succès');
          }
        }, 1000);
      } catch (err: any) {
        console.error('Erreur lors de l\'exécution des scripts de visualisation:', err);
        toast({
          title: "Erreur d'initialisation",
          description: "Problème lors de l'initialisation de la visualisation",
          variant: "destructive",
        });
      }
    }
  }, [isLoading, error, htmlContent, toast]);

  // Fonction pour gérer le changement du nombre de lignes affichées
  const handleRowsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'all') {
      setMaxDisplayedRows(topicData.length);
      setDisplayedRows(topicData.length);
    } else {
      const numRows = parseInt(value);
      setMaxDisplayedRows(numRows);
      setDisplayedRows(numRows);
    }
  };

  // Trier et filtrer les données à afficher
  const sortedTopicData = topicData.sort((a, b) => a.id - b.id);
  const displayedTopics = sortedTopicData.slice(0, maxDisplayedRows);

  return (
    <div className="min-h-[400px] relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-[400px]" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      )}
      
      {!isLoading && !error && htmlContent.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-amber-500">Le fichier HTML chargé est vide</div>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Visualisation principale (2/3 de la largeur) */}
        <div className="md:col-span-2">
          <div
            ref={containerRef}
            id="topic-visualization-container"
            style={{
              display: isLoading ? 'none' : 'block',
              height: '500px',
              overflow: 'auto',
              width: '100%'
            }}
          />
        </div>
        
        {/* Panneau d'information sur le topic sélectionné (1/3 de la largeur) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm h-[500px] overflow-auto">
          {selectedTopic ? (
            <div>
              <h3 className="text-lg font-bold text-indigo-700 mb-3">
                Topic {selectedTopic.id}
              </h3>
              
              <div className="mb-4">
                <h4 className="flex items-center text-sm font-semibold text-gray-500 uppercase mb-1">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  Résumé
                </h4>
                <p className="text-gray-700 italic">{selectedTopic.summary}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="flex items-center text-sm font-semibold text-gray-500 uppercase mb-1">
                  <TagIcon className="h-4 w-4 mr-1" />
                  Mots-clés
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTopic.keywords.map((keyword, index) => (
                    <span 
                      key={index} 
                      className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="flex items-center text-sm font-semibold text-gray-500 uppercase mb-1">
                  <BuildingIcon className="h-4 w-4 mr-1" />
                  Espaces représentatifs
                </h4>
                {selectedTopic.spaces && selectedTopic.spaces.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {selectedTopic.spaces.map((space, idx) => (
                      <li key={idx}>{space}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">Aucun espace représentatif</p>
                )}
              </div>
              
              <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-500 uppercase mb-1">
                  <Users2Icon className="h-4 w-4 mr-1" />
                  Documents
                </h4>
                <p className="text-gray-700">
                  Ce topic contient <strong>{selectedTopic.count}</strong> documents.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <InfoIcon className="h-8 w-8 mb-2 text-indigo-300" />
              <p className="text-center">
                Cliquez sur un segment du graphique pour voir les détails du topic correspondant.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tableau récapitulatif des topics */}
      {topicData.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-700">
              Tous les topics ({displayedTopics.length} sur {topicData.length})
            </h3>
            
            {/* Sélecteur pour le nombre de lignes à afficher */}
            <div className="flex items-center gap-2">
              <label htmlFor="rows-select" className="text-sm text-gray-600">
                Afficher :
              </label>
              <div className="relative">
                <select
                  id="rows-select"
                  value={maxDisplayedRows === topicData.length ? 'all' : maxDisplayedRows.toString()}
                  onChange={handleRowsChange}
                  className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="5">5 lignes</option>
                  <option value="10">10 lignes</option>
                  <option value="20">20 lignes</option>
                  <option value="50">50 lignes</option>
                  <option value="all">Toutes les lignes</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mots-clés</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Résumé</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Espaces</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Documents</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedTopics.map((topic) => (
                  <tr key={topic.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {topic.id}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {topic.keywords.slice(0, 3).map((kw, i) => (
                          <span key={i} className="bg-gray-100 px-1 rounded text-xs">{kw}</span>
                        ))}
                        {topic.keywords.length > 3 && <span className="text-xs">...</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {topic.summary.length > 55 
                        ? topic.summary.substring(0, 55) + "..." 
                        : topic.summary}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {topic.spaces && topic.spaces.length > 0 
                        ? (topic.spaces.length > 1 
                            ? topic.spaces[0] + "..." 
                            : topic.spaces[0]) 
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500 text-right">
                      {topic.count}
                    </td>
                    <td className="px-3 py-2 text-sm text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => setSelectedTopic(topic)}
                      >
                        Détails
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Message informatif si toutes les lignes ne sont pas affichées */}
          {maxDisplayedRows < topicData.length && (
            <div className="mt-2 text-sm text-gray-500 text-center">
              {topicData.length - maxDisplayedRows} topics supplémentaires non affichés. 
              <button 
                onClick={() => {
                  setMaxDisplayedRows(topicData.length);
                  setDisplayedRows(topicData.length);
                }}
                className="ml-1 text-indigo-600 hover:text-indigo-800 underline"
              >
                Afficher tous
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicsVisualization;