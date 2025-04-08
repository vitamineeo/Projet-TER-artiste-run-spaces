
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
    const height = width * 0.6;

    // Précharger les données du monde pour accélérer le rendu
    const svg = window.d3.select(containerId)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height);

    const g = svg.append("g");

    const projection = window.d3.geoNaturalEarth1()
      .scale(width / 5)
      .translate([width / 2, height / 2]);

    const path = window.d3.geoPath().projection(projection);

    const tooltip = window.d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("display", "none");

    // Ajout du zoom avec performances optimisées
    const zoom = window.d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Chargement en parallèle pour optimisation
    window.d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((world) => {
        // Utiliser window.topojson pour accéder à topojson
        const countries = window.topojson.feature(world, world.objects.countries);

        g.append("g")
          .selectAll("path")
          .data(countries.features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path)
          .attr("fill", "lightgray")
          .attr("stroke", "#fff");

        // Ajouter les points après que la carte soit prête
        g.selectAll("circle")
          .data(spacesData)
          .enter()
          .append("circle")
          .attr("class", "location-point")
          .attr("cx", (d: any) => projection([d.longitude, d.latitude])[0])
          .attr("cy", (d: any) => projection([d.longitude, d.latitude])[1])
          .attr("r", 5)
          .on("mouseover", (event: any, d: any) => {
            tooltip.style("display", "block")
              .html(`
                <div class="tooltip-title">${d.nom}</div>
                <div class="tooltip-info">
                  <div>📍 Ville: ${d.ville || 'Non spécifié'}</div>
                  <div>🌍 Pays: ${d.pays || 'Non spécifié'}</div>
                  ${d.website ? `<div>🔗 <a href="${d.website}" target="_blank">Site web</a></div>` : ''}
                </div>
              `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mousemove", (event: any) => {
            tooltip.style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", () => {
            tooltip.style("display", "none");
          });
      })
      .catch(error => {
        console.error('Error loading map data:', error);
        setIsLoading(false);
      });

    // Optimisation pour le resize
    const debouncedResize = debounce(() => {
      if (!container) return;
      
      const newWidth = (container as HTMLElement).clientWidth;
      const newHeight = newWidth * 0.6;

      svg.attr("width", "100%").attr("height", newHeight);
      projection.scale(newWidth / 5).translate([newWidth / 2, newHeight / 2]);

      svg.selectAll("path").attr("d", path);
      svg.selectAll("circle")
        .attr("cx", (d: any) => projection([d.longitude, d.latitude])[0])
        .attr("cy", (d: any) => projection([d.longitude, d.latitude])[1]);
    }, 250);

    window.addEventListener("resize", debouncedResize);
  };

  // Simple debounce function pour limiter les appels lors du resize
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
        <Skeleton className="w-full h-[400px] rounded-lg" />
      )}
      <div 
        id="map-container" 
        ref={mapContainerRef} 
        className="w-full h-[400px] bg-gray-100 rounded-lg"
        style={{ opacity: isLoading ? 0 : 1 }}
      />
    </div>
  );
};

export default WorldMap;