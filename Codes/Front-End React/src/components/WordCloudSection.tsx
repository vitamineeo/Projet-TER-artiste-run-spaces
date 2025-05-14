import React, { useEffect, useState } from 'react';
import { CloudLightning } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
// Import statique du fichier JSON
import wordCloudData from '../data/word_cloud_data.json';

// Interface ajustée pour correspondre au format Python
interface WordData {
  word: string;
  value: number;
}

const WordCloudSection = () => {
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fonction pour charger les données du nuage de mots
    const loadWordCloudData = async () => {
      try {
        setLoading(true);
        
        // Utiliser les données importées statiquement
        if (wordCloudData && Array.isArray(wordCloudData)) {
          // Adapter le format des données (word -> text pour la cohérence avec d3-cloud)
          const formattedData = wordCloudData.map((item: any) => ({
            text: item.word,
            value: item.value * 100 // Multiplier par 100 pour avoir des valeurs plus utilisables
          }));
          setWords(formattedData);
          console.log(`Nuage de mots chargé avec ${formattedData.length} mots`);
        } else {
          throw new Error('Format de données invalide');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données du nuage de mots:', error);
        setError('Impossible de charger les données du nuage de mots');
        setLoading(false);
      }
    };

    loadWordCloudData();
  }, []);

  // Générer le nuage de mots avec d3-cloud
  useEffect(() => {
    if (!loading && words.length > 0) {
      const renderWordCloud = async () => {
        try {
          // Dynamiquement importer d3-cloud
          const d3Cloud = await import('d3-cloud');
          
          // Configuration de base du nuage
          const width = 800;
          const height = 600;
          
          // Nettoyer le conteneur
          const container = document.getElementById('word-cloud-container');
          if (!container) return;
          container.innerHTML = '';
          
          // Calculer des tailles de police proportionnelles
          const minFontSize = 14;
          const maxFontSize = 80;
          const maxValue = Math.max(...words.map(w => w.value));
          const minValue = Math.min(...words.map(w => w.value));
          
          const fontSizeScale = (value: number) => {
            return minFontSize + ((value - minValue) / (maxValue - minValue)) * (maxFontSize - minFontSize);
          };
          
          // Configurer le layout de cloud
          const layout = d3Cloud.default()
            .size([width, height])
            .words(words.map(word => ({
              text: word.text,
              size: fontSizeScale(word.value),
              value: word.value
            })))
            .padding(8)
            .rotate(() => ~~(Math.random() * 2) * 90)
            .fontSize(d => d.size)
            .on("end", draw);
          
          // Lancer le calcul du layout
          layout.start();
          
          // Fonction pour dessiner le nuage
          function draw(words: any[]) {
            const d3 = window.d3; // Utiliser d3 global
            
            // Créer le SVG
            const svg = d3.select("#word-cloud-container")
              .append("svg")
              .attr("width", width)
              .attr("height", height)
              .attr("viewBox", `0 0 ${width} ${height}`)
              .attr("class", "mx-auto");
            
            // Groupe principal centré
            const g = svg.append("g")
              .attr("transform", `translate(${width / 2}, ${height / 2})`);
            
            // Palette de couleurs issue de votre Python (similaire à viridis)
            const colorScale = d3.scaleOrdinal([
              "#440154", "#482777", "#3f4a8a", "#31678e", "#26838f",
              "#1f9d8a", "#6cce5a", "#b6de2b", "#fee825", "#f0f921"
            ]);
            
            // Ajouter chaque mot
            g.selectAll("text")
              .data(words)
              .enter().append("text")
              .style("font-size", d => `${d.size}px`)
              .style("font-family", "Arial, sans-serif")
              .style("font-weight", "600")
              .style("fill", (d, i) => colorScale(i.toString()))
              .style("opacity", 0.9)
              .attr("text-anchor", "middle")
              .attr("transform", d => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
              .text(d => d.text)
              .style("cursor", "pointer")
              .on("mouseover", function(event, d) {
                d3.select(this)
                  .transition()
                  .duration(200)
                  .style("opacity", 1)
                  .style("fill", "#ff6b35")
                  .style("font-size", `${d.size * 1.1}px`);
                
                // Tooltip
                const tooltip = d3.select("#word-cloud-tooltip");
                tooltip.style("display", "block")
                  .html(`<strong>${d.text}</strong><br/>Fréquence: ${d.value.toFixed(3)}`)
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 25) + "px");
              })
              .on("mouseout", function(event, d) {
                d3.select(this)
                  .transition()
                  .duration(200)
                  .style("opacity", 0.9)
                  .style("fill", colorScale(words.indexOf(d).toString()))
                  .style("font-size", `${d.size}px`);
                
                // Masquer tooltip
                d3.select("#word-cloud-tooltip").style("display", "none");
              });
          }
        } catch (error) {
          console.error('Erreur lors du rendu du nuage de mots:', error);
          setError('Impossible de générer le nuage de mots');
        }
      };
      
      renderWordCloud();
    }
  }, [loading, words]);

  const exportSVG = () => {
    const svg = document.querySelector('#word-cloud-container svg');
    if (!svg) return;
    
    // Convertir SVG en chaîne XML
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    
    // Ajouter l'espace de nom XML
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    // Ajouter les styles inline pour préserver l'apparence
    if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    
    // Ajouter déclaration XML
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    
    // Convertir en URL data
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    
    // Créer élément a pour téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nuage_mots.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportPNG = () => {
    const svg = document.querySelector('#word-cloud-container svg');
    if (!svg) return;
    
    // Créer un canvas pour exporter en PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Obtenir les dimensions du SVG
    const svgBounds = svg.getBoundingClientRect();
    canvas.width = svgBounds.width;
    canvas.height = svgBounds.height;
    
    // Convertir SVG en data URL
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    
    // Ajouter l'espace de nom XML si nécessaire
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    
    img.onload = function() {
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0);
      
      // Télécharger le PNG
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'nuage_mots.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    
    img.src = url;
  };

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
          <CloudLightning className="mr-2 h-6 w-6" />
          Nuage de mots-clés
        </h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          {loading ? (
            <div className="w-full flex justify-center items-center py-10">
              <Skeleton className="h-[600px] w-full" />
            </div>
          ) : error ? (
            <div className="w-full h-[400px] flex justify-center items-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="relative">
              <div id="word-cloud-container" className="min-h-[600px] w-full overflow-hidden" />
              <div id="word-cloud-tooltip" className="absolute hidden bg-black bg-opacity-90 text-white p-3 rounded-md text-sm pointer-events-none z-50 border border-gray-300"></div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button onClick={exportSVG} variant="outline">
                  Télécharger SVG
                </Button>
                <Button onClick={exportPNG} variant="outline">
                  Télécharger PNG
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">À propos de ce nuage de mots</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Ce nuage de mots présente les termes les plus fréquemment utilisés dans les descriptions des espaces artistiques.</li>
                <li>La taille de chaque mot est proportionnelle à sa fréquence d'apparition dans le corpus de textes.</li>
                <li>Les couleurs permettent une meilleure lisibilité et distinction des mots.</li>
              </ul>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Utilisation</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Survolez un mot pour voir sa fréquence exacte</li>
                <li>Cliquez sur les boutons pour télécharger l'image en SVG ou PNG</li>
                <li>Les mots sont affichés avec des rotations aléatoires pour optimiser l'espace</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WordCloudSection;