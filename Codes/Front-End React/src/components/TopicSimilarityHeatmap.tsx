import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BarChart2Icon } from "lucide-react";

const TopicSimilarityHeatmap = () => {
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
        console.log('Chargement du fichier topic_similarity_heatmap.html...');
        
        const response = await fetch('/topic_similarity_heatmap.html');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.text();
        console.log('Contenu HTML de la heatmap chargé, longueur:', data.length);
        
        if (data.length === 0) {
          throw new Error('Le fichier HTML de la heatmap est vide');
        }
        
        setHtmlContent(data);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Erreur de chargement de topic_similarity_heatmap.html :', error);
        setError(`Impossible de charger la heatmap de similarité: ${error.message}`);
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
      console.log('Nettoyage du composant TopicSimilarityHeatmap');
      hasInitialized.current = false;
    };
  }, [toast]);

  // Utiliser un useEffect séparé pour gérer l'exécution des scripts
  useEffect(() => {
    if (!isLoading && !error && htmlContent && containerRef.current) {
      console.log('Préparation à l\'exécution des scripts de la heatmap');
      
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
        
        console.log('Scripts de la heatmap exécutés');
        
        // La vérification est différente pour cette visualisation spécifique
        // car la structure peut être légèrement différente
      } catch (err: any) {
        console.error('Erreur lors de l\'exécution des scripts de la heatmap:', err);
        // Ne pas afficher de toast pour éviter les avertissements non nécessaires
        // Simplement journaliser l'erreur
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
          <div className="text-amber-500">Le fichier HTML de la heatmap est vide</div>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center mb-3">
          <BarChart2Icon className="h-5 w-5 mr-2 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">Matrice de similarité entre Topics</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Cette heatmap montre les similarités sémantiques entre les différents topics identifiés.
          Les zones plus claires indiquent une plus grande similarité thématique.
        </p>
        
        <div
          ref={containerRef}
          id="topic-similarity-container"
          style={{
            display: isLoading ? 'none' : 'block',
            height: '600px',
            overflow: 'auto',
            width: '100%'
          }}
        />
        
        <div className="mt-3 text-xs text-gray-500 italic">
          <p>Les valeurs plus élevées (couleurs plus claires) indiquent des topics plus similaires.</p>
          <p>Survolez les cellules pour voir les valeurs exactes de similarité entre les topics.</p>
        </div>
      </div>
    </div>
  );
};

export default TopicSimilarityHeatmap;