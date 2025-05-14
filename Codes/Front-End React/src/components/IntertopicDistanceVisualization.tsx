import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MapIcon } from "lucide-react";

const IntertopicDistanceVisualization = () => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef<boolean>(false);

  useEffect(() => {
    // Si déjà initialisé, ne pas refaire le chargement pour éviter la duplication
    if (hasInitialized.current) return;
    
    const fetchHtmlContent = async () => {
      try {
        setIsLoading(true);
        console.log('Chargement du fichier intertopic_distance_map.html...');
        
        const response = await fetch('/intertopic_distance_map.html');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.text();
        console.log('Contenu HTML de la carte de distance intertopique chargé, longueur:', data.length);
        
        if (data.length === 0) {
          throw new Error('Le fichier HTML de la carte de distance intertopique est vide');
        }
        
        setHtmlContent(data);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Erreur de chargement de intertopic_distance_map.html :', error);
        setError(`Impossible de charger la carte de distance intertopique: ${error.message}`);
        setIsLoading(false);
        toast({
          title: "Erreur de chargement",
          description: error.message || "Une erreur s'est produite",
          variant: "destructive",
        });
      }
    };
    
    fetchHtmlContent();
    hasInitialized.current = true;
    
    return () => {
      console.log('Nettoyage du composant IntertopicDistanceVisualization');
      hasInitialized.current = false;
    };
  }, [toast]);

  // Utiliser un useEffect séparé pour gérer l'exécution des scripts
  useEffect(() => {
    if (!isLoading && !error && htmlContent && containerRef.current) {
      console.log('Préparation à l\'exécution des scripts de la carte de distance intertopique');
      
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
        
        // Utiliser dangerouslySetInnerHTML pour garder la compatibilité
        containerRef.current.innerHTML = "";  // Vider d'abord le conteneur
        const visualizationDiv = document.createElement('div');
        visualizationDiv.innerHTML = htmlContent;
        containerRef.current.appendChild(visualizationDiv);
        
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
        
        console.log('Scripts de la carte de distance intertopique exécutés');
        
        // Vérifier si le rendu a bien fonctionné
        setTimeout(() => {
          const plotlyElement = containerRef.current?.querySelector('.plotly-graph-div');
          if (!plotlyElement) {
            console.log('La carte semble ne pas avoir été rendue correctement');
            toast({
              title: "Attention",
              description: "La visualisation pourrait ne pas s'être correctement chargée",
              variant: "default",
            });
          } else {
            console.log('Carte de distance intertopique rendue avec succès');
          }
        }, 1000);
      } catch (err: any) {
        console.error('Erreur lors de l\'exécution des scripts de la carte de distance intertopique:', err);
        toast({
          title: "Erreur d'initialisation",
          description: "Problème lors de l'initialisation de la carte de distance intertopique",
          variant: "destructive",
        });
      }
    }
  }, [isLoading, error, htmlContent, toast]);

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
          <div className="text-amber-500">Le fichier HTML de la carte de distance intertopique est vide</div>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center mb-3">
          <MapIcon className="h-5 w-5 mr-2 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">Carte des Distances entre Topics</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Cette visualisation répartit les topics dans un espace 2D où les distances reflètent leur similarité sémantique.
          Les topics proches traitent de thématiques connexes, tandis que les topics éloignés abordent des sujets distincts.
        </p>
        
        <div
          ref={containerRef}
          id="visualization-intertopic-container"
          style={{
            display: isLoading ? 'none' : 'block',
            height: '600px',
            overflow: 'auto',
            width: '100%'
          }}
        />
        
        <div className="mt-3 text-xs text-gray-500 italic">
          <p>La taille des cercles représente le nombre de documents associés à chaque topic.</p>
          <p>Survolez les points pour voir les mots-clés principaux et le nombre de documents par topic.</p>
        </div>
      </div>
    </div>
  );
};

export default IntertopicDistanceVisualization;