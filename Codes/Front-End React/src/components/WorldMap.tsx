import React, { useEffect, useRef } from 'react';
import spacesData from '../data/spaces.json';
import { Skeleton } from "@/components/ui/skeleton";

const WorldMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInitializedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // Créer la carte uniquement si les scripts sont chargés et le DOM est prêt
    const initializeMap = () => {
      if (!window.d3 || !mapContainerRef.current || mapInitializedRef.current) return;
      
      mapInitializedRef.current = true;
      createMap("#map-container");
      setIsLoading(false);
    };

    // Vérifier périodiquement si D3 est chargé
    const checkD3Loaded = setInterval(() => {
      if (window.d3 && window.topojson && mapContainerRef.current) {
        clearInterval(checkD3Loaded);
        initializeMap();
      }
    }, 100);

    return () => {
      clearInterval(checkD3Loaded);
    };
  }, []);

  const createMap = (containerId: string) => {
    const container = document.querySelector(containerId);
    if (!container) return;
    
    const width = (container as HTMLElement).clientWidth;
    const height = Math.min(width * 0.6, 600); // Limiter la hauteur maximale

    // Nettoyer le conteneur s'il y a déjà du contenu
    window.d3.select(containerId).selectAll("*").remove();

    const svg = window.d3.select(containerId)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("background-color", "#dbeafe"); // Ajout du fond océan directement au SVG

    // Groupe principal pour le zoom
    const g = svg.append("g");

    // Calculer l'échelle en fonction de la taille de l'écran
    const scale = Math.min(width / 5, height / 3);
    
    const projection = window.d3.geoNaturalEarth1()
      .scale(scale)
      .translate([width / 2, height / 2]);

    const path = window.d3.geoPath().projection(projection);

    // Tooltip
    let tooltip = window.d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
      tooltip = window.d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("display", "none")
        .style("z-index", "1000");
    }

    // Zoom avec contraintes plus appropriées
    const zoom = window.d3.zoom()
      .scaleExtent([0.5, 5]) // Permettre de dézoomer un peu plus
      .translateExtent([
        [-width / 2, -height / 2],
        [width * 1.5, height * 1.5]
      ])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Reset zoom button (optionnel)
    const resetButton = svg.append("g")
      .attr("class", "reset-button")
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition()
          .duration(750)
          .call(zoom.transform, window.d3.zoomIdentity);
      });

    resetButton.append("rect")
      .attr("x", 10)
      .attr("y", 10)
      .attr("width", 60)
      .attr("height", 25)
      .attr("fill", "white")
      .attr("stroke", "#ccc")
      .attr("rx", 3);

    resetButton.append("text")
      .attr("x", 40)
      .attr("y", 27)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-family", "Arial, sans-serif")
      .text("Reset");

    // Chargement de la carte
    window.d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((world) => {
        const countries = window.topojson.feature(world, world.objects.countries);

        // Stocker les features pour le resize
        (svg.node() as any).__countries__ = countries;

        g.append("g")
          .selectAll("path")
          .data(countries.features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path)
          .attr("fill", "#ffffff") // Fond blanc pour les pays
          .attr("stroke", "#e5e7eb") // Bordures grises plus claires
          .attr("stroke-width", 0.7); // Bordures légèrement plus visibles

        // Ajouter les points avec une taille réduite
        g.selectAll("circle")
          .data(spacesData)
          .enter()
          .append("circle")
          .attr("class", "location-point")
          .attr("cx", (d: any) => projection([d.longitude, d.latitude])[0])
          .attr("cy", (d: any) => projection([d.longitude, d.latitude])[1])
          .attr("r", 3) // Taille réduite des cercles
          .attr("fill", "#3b82f6")
          .attr("stroke", "#1d4ed8")
          .attr("stroke-width", 0.5)
          .attr("opacity", 0.8)
          .style("cursor", "pointer")
          .on("mouseover", (event: any, d: any) => {
            // Agrandir le cercle au survol
            window.d3.select(event.currentTarget)
              .transition()
              .duration(150)
              .attr("r", 5)
              .attr("opacity", 1);

            tooltip.style("display", "block")
              .html(`
                <div style="font-weight: bold; margin-bottom: 4px;">${d.nom}</div>
                <div style="margin-bottom: 2px;">📍 Ville: ${d.ville || 'Non spécifié'}</div>
                <div style="margin-bottom: 2px;">🌍 Pays: ${d.pays || 'Non spécifié'}</div>
                ${d.website ? `<div>🔗 <a href="${d.website}" target="_blank" style="color: #60a5fa;">Site web</a></div>` : ''}
              `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 10) + "px");
          })
          .on("mousemove", (event: any) => {
            tooltip.style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 10) + "px");
          })
          .on("mouseout", (event: any) => {
            // Remettre la taille normale
            window.d3.select(event.currentTarget)
              .transition()
              .duration(150)
              .attr("r", 3)
              .attr("opacity", 0.8);

            tooltip.style("display", "none");
          });
      })
      .catch(error => {
        console.error('Error loading map data:', error);
        setIsLoading(false);
      });

    // Gestion du resize avec debounce - Version améliorée
    const debouncedResize = debounce(() => {
      if (!container) return;
      
      const newWidth = (container as HTMLElement).clientWidth;
      const newHeight = Math.min(newWidth * 0.6, 600);
      const newScale = Math.min(newWidth / 5, newHeight / 3);

      svg.attr("viewBox", `0 0 ${newWidth} ${newHeight}`);
      
      // Mettre à jour la projection
      projection.scale(newScale).translate([newWidth / 2, newHeight / 2]);

      // Actualiser les paths avec les bons styles
      svg.selectAll("path.country")
        .attr("d", path)
        .attr("fill", "#ffffff") // Maintenir le fond blanc
        .attr("stroke", "#e5e7eb") // Maintenir les bordures
        .attr("stroke-width", 0.7);
      
      // Actualiser les cercles avec leurs styles
      svg.selectAll("circle.location-point")
        .attr("cx", (d: any) => projection([d.longitude, d.latitude])[0])
        .attr("cy", (d: any) => projection([d.longitude, d.latitude])[1])
        .attr("fill", "#3b82f6") // Maintenir la couleur bleue
        .attr("stroke", "#1d4ed8")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.8);
    }, 250);

    window.addEventListener("resize", debouncedResize);
    
    // Nettoyage
    return () => {
      window.removeEventListener("resize", debouncedResize);
    };
  };

  // Simple debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-lg"> {/* Changé à bg-white */}
          <Skeleton className="w-full h-[400px] rounded-lg" />
        </div>
      )}
      <div 
        id="map-container" 
        ref={mapContainerRef} 
        className="w-full h-[400px] bg-white rounded-lg overflow-hidden border border-gray-200" // Changé à bg-white
        style={{ 
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .tooltip {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .tooltip a {
            color: #60a5fa;
            text-decoration: none;
          }
          .tooltip a:hover {
            text-decoration: underline;
          }
        `
      }} />
    </div>
  );
};

export default WorldMap;