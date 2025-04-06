import React, { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
// Import statique du fichier JSON
import staticGraphData from '../data/semantic_network.json';

// Définir les types pour les données du graphe
interface Node {
  id: string;
  name: string;
  topic: number;
}

interface Link {
  source: string;
  target: string;
  weight: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const RelationsGraph = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Utiliser les données statiques importées plutôt que de faire un fetch
        console.log('Données du réseau sémantique chargées:', staticGraphData);
        setGraphData(staticGraphData);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Erreur de chargement des données du graphe:', error);
        setError(`Impossible de charger le graphe des relations: ${error.message}`);
        setIsLoading(false);
      }
    };

    loadData();

    // Nettoyage à la désinscription
    return () => {
      const container = document.getElementById('graph-relations-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  // Initialiser le graphe lorsque les données sont chargées et que D3 est disponible
  useEffect(() => {
    if (!isLoading && !error && graphData && window.d3 && document.getElementById('graph-relations-container')) {
      initSemanticGraph(graphData);
    }
  }, [isLoading, error, graphData]);

  const initSemanticGraph = (data: GraphData) => {
    const container = document.getElementById('graph-relations-container');
    if (!container) return;
    
    // Nettoyer le conteneur avant d'initialiser
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 500;

    // d3 est chargé dynamiquement à partir de window
    const svg = window.d3.select("#graph-relations-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Utiliser les données JSON chargées
    const { nodes, links } = data;

    // Utiliser window.d3 pour accéder à d3
    const color = window.d3.scaleOrdinal(window.d3.schemeCategory10);

    // Utiliser window.d3 pour accéder à d3
    const simulation = window.d3.forceSimulation(nodes)
      .force("link", window.d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", window.d3.forceManyBody().strength(-300))
      .force("center", window.d3.forceCenter(width / 2, height / 2));

    const link = svg.selectAll("line")
      .data(links)
      .enter().append("line")
      .style("stroke", "#aaa")
      .style("stroke-width", (d: any) => d.weight * 2);

    const node = svg.selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", 10)
      .attr("fill", (d: any) => color(d.topic))
      .call(drag(simulation));

    const label = svg.selectAll("text")
      .data(nodes)
      .enter().append("text")
      .attr("dy", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "black")
      .text((d: any) => d.name);

    // Ajouter des légendes pour les topics
    const uniqueTopics = [...new Set(nodes.map(node => node.topic))];
    const legend = svg.selectAll(".legend")
      .data(uniqueTopics)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${width - 120}, ${i * 25 + 20})`);

    legend.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", d => color(d));

    legend.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .text(d => `Topic ${d}`);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: any) {
      function dragStarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragEnded(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      // Utiliser window.d3 pour accéder à d3
      return window.d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded);
    }
  };

  return (
    <div className="relative min-h-[500px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-[500px]" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      )}
      
      <div 
        id="graph-relations-container" 
        className="min-h-[500px]"
        style={{ display: isLoading ? 'none' : 'block' }}
      >
        {!isLoading && !error && !graphData && (
          <div className="flex items-center justify-center h-full">
            <p className="text-amber-500">Aucune donnée disponible pour le graphe.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationsGraph;