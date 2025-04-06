import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const TopicsVisualization = () => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHtmlContent = async () => {
      try {
        setIsLoading(true);
        console.log('Chargement du fichier topic_mapping.html...');
        
        // Assurez-vous que le chemin est correct par rapport à votre structure de dossiers publics
        const response = await fetch('/topic_mapping.html');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.text();
        console.log('Contenu HTML chargé, longueur:', data.length);
        
        if (data.length === 0) {
          throw new Error('Le fichier HTML est vide');
        }
        
        setHtmlContent(data);
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
    
    fetchHtmlContent();
    
    return () => {
      console.log('Nettoyage du composant TopicsVisualization');
    };
  }, [toast]);

  // Utiliser un useEffect séparé pour gérer l'exécution des scripts
  useEffect(() => {
    if (!isLoading && !error && htmlContent && containerRef.current) {
      console.log('Préparation à l\'exécution des scripts de la visualisation');
      
      try {
        // Récupérer tous les scripts depuis le contenu HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const scripts = Array.from(doc.querySelectorAll('script'));
        
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
              variant: "warning",
            });
          } else {
            console.log('Visualisation rendue avec succès');
          }
        }, 1000);
      } catch (err: any) {
        console.error('Erreur lors de l\'exécution des scripts:', err);
        toast({
          title: "Erreur d'initialisation",
          description: "Problème lors de l'initialisation de la visualisation",
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
          <div className="text-amber-500">Le fichier HTML chargé est vide</div>
        </div>
      )}
      
      <div
        ref={containerRef}
        id="topic-visualization-container"
        style={{
          display: isLoading ? 'none' : 'block',
          height: '500px',
          overflow: 'auto',
          width: '100%'
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default TopicsVisualization;
