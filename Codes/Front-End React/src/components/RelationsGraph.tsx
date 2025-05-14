import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Network, 
  MoveIcon, 
  ZoomInIcon, 
  ZoomOutIcon, 
  SearchIcon, 
  EyeIcon, 
  EyeOffIcon,
  BarChart3Icon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import * as d3 from 'd3';

// Définir les types pour les données du graphe
interface Node {
  id: string;
  space_name: string;
  topic: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  weight: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface NetworkStats {
  nodeCount: number;
  edgeCount: number;
  density: number;
  avgDegree: number;
  avgWeightedDegree: number;
  maxWeight: number;
  minWeight: number;
  avgWeight: number;
  medianWeight: number;
  topicCount: number;
  centralNodes: { id: string; name: string; degree: number }[];
}

const RelationsGraph = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [nodeCount, setNodeCount] = useState<number>(0);
  const [edgeCount, setEdgeCount] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.492);
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const simulationRef = useRef<any>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodeRef = useRef<any>(null); // Référence pour les nœuds
  const linkRef = useRef<any>(null); // Référence pour les liens

  // Charger les données dynamiquement
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('Tentative de chargement du fichier JSON...');
        const response = await fetch('/data/semantic_network_spaces_data.json');
        if (!response.ok) throw new Error('Fichier non trouvé');
        const data = await response.json();
        console.log('Données JSON chargées avec succès:', data);
        setRawData(data);

        const mappedNodes = data.nodes.map((node: any) => ({
          id: String(node.id),
          name: node.space_name,
          topic: node.topic,
        }));

        const mappedLinks = data.edges.map((edge: any) => ({
          source: String(edge.source),
          target: String(edge.target),
          weight: edge.weight,
        }));

        setAllLinks(mappedLinks);
        const formattedData = { nodes: mappedNodes, links: mappedLinks };
        setGraphData(formattedData);
        setNodeCount(mappedNodes.length);
        setEdgeCount(mappedLinks.length);
        calculateNetworkStats(mappedNodes, mappedLinks);
      } catch (error: any) {
        console.error('Erreur de chargement des données:', error);
        setError(`Impossible de charger le graphe: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    return () => {
      if (simulationRef.current) simulationRef.current.stop();
      const container = document.getElementById('graph-relations-container');
      if (container) container.innerHTML = '';
    };
  }, []);

  // Filtrer les liens selon le seuil
  useEffect(() => {
    if (graphData && allLinks.length) {
      const filteredLinks = allLinks.filter(link => link.weight >= similarityThreshold);
      setGraphData(prev => prev ? { ...prev, links: filteredLinks } : null);
      setEdgeCount(filteredLinks.length);
    }
  }, [similarityThreshold, allLinks]);

  // Filtrer les nœuds selon la recherche
  useEffect(() => {
    if (!graphData || !searchTerm.trim()) return;
    const term = searchTerm.toLowerCase().trim();
    const filteredNodes = rawData.nodes
      .map((node: any) => ({
        id: String(node.id),
        name: node.space_name,
        topic: node.topic,
      }))
      .filter((node: Node) => node.name.toLowerCase().includes(term));
    const matchingNodeIds = new Set(filteredNodes.map((node: Node) => node.id));
    if (term === '') setHighlightedNode(null);
    else if (filteredNodes.length === 1) setHighlightedNode(filteredNodes[0].id);
  }, [searchTerm, rawData]);

  // Recalculer les statistiques lorsque graphData ou similarityThreshold change
  useEffect(() => {
    if (graphData) {
      calculateNetworkStats(graphData.nodes, graphData.links);
    }
  }, [graphData, similarityThreshold]);

  // Calculer les statistiques du réseau
  const calculateNetworkStats = (nodes: Node[], links: Link[]) => {
    if (!nodes.length || !links.length) return;

    const nodeCount = nodes.length;
    const edgeCount = links.length;
    const density = (2 * edgeCount) / (nodeCount * (nodeCount - 1));

    const weights = links.map(link => link.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;
    const sortedWeights = [...weights].sort((a, b) => a - b);
    const medianWeight = sortedWeights.length % 2 === 0
      ? (sortedWeights[sortedWeights.length / 2 - 1] + sortedWeights[sortedWeights.length / 2]) / 2
      : sortedWeights[Math.floor(sortedWeights.length / 2)];

    const nodeDegrees = new Map();
    const nodeWeightedDegrees = new Map();
    nodes.forEach(node => {
      nodeDegrees.set(node.id, 0);
      nodeWeightedDegrees.set(node.id, 0);
    });
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      nodeDegrees.set(sourceId, (nodeDegrees.get(sourceId) || 0) + 1);
      nodeDegrees.set(targetId, (nodeDegrees.get(targetId) || 0) + 1);
      nodeWeightedDegrees.set(sourceId, (nodeWeightedDegrees.get(sourceId) || 0) + link.weight);
      nodeWeightedDegrees.set(targetId, (nodeWeightedDegrees.get(targetId) || 0) + link.weight);
    });

    const degrees = Array.from(nodeDegrees.values());
    const avgDegree = degrees.reduce((sum, d) => sum + d, 0) / degrees.length;
    const weightedDegrees = Array.from(nodeWeightedDegrees.values());
    const avgWeightedDegree = weightedDegrees.reduce((sum, d) => sum + d, 0) / weightedDegrees.length;

    const centralNodes = Array.from(nodeDegrees.entries())
      .map(([id, degree]) => {
        const node = nodes.find(n => n.id === id);
        return { id, name: node?.name || '', degree: degree as number };
      })
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5);

    const uniqueTopics = new Set(nodes.map(node => node.topic));
    const topicCount = uniqueTopics.size;

    setNetworkStats({
      nodeCount,
      edgeCount,
      density,
      avgDegree,
      avgWeightedDegree,
      maxWeight,
      minWeight,
      avgWeight,
      medianWeight,
      topicCount,
      centralNodes,
    });
  };

  // Distribution des poids pour l’histogramme
  const weightDistribution = useMemo(() => {
    if (!allLinks.length) return [];
    const weights = allLinks.map(link => link.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min;
    const bucketSize = range / 10;
    const buckets = Array(10).fill(0);
    weights.forEach(weight => {
      const bucketIndex = Math.min(Math.floor((weight - min) / bucketSize), 9);
      buckets[bucketIndex]++;
    });
    return buckets.map((count, i) => ({
      range: `${(min + i * bucketSize).toFixed(2)}-${(min + (i + 1) * bucketSize).toFixed(2)}`,
      count,
      min: min + i * bucketSize,
      max: min + (i + 1) * bucketSize,
    }));
  }, [allLinks]);

  // Initialiser le graphe
  useEffect(() => {
    if (!isLoading && !error && graphData && document.getElementById('graph-relations-container')) {
      console.log('Initialisation du graphe avec les données:', graphData);
      initSemanticGraph(graphData);
    }
  }, [isLoading, error, graphData, similarityThreshold]);

  // Mettre à jour les styles des nœuds et liens en fonction de showLabels et highlightedNode
  useEffect(() => {
    if (nodeRef.current) {
      nodeRef.current.select("text")
        .style("display", showLabels ? "block" : "none")
        .style("font-weight", (d: any) => highlightedNode === d.id ? "bold" : "normal");
    }
  }, [showLabels, highlightedNode]);

  const initSemanticGraph = (data: GraphData) => {
    const container = document.getElementById('graph-relations-container');
    if (!container) return;

    container.innerHTML = '';
    const width = container.clientWidth;
    const height = 600;

    const svg = d3.select("#graph-relations-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .call(d3.zoom().scaleExtent([0.1, 8]).on("zoom", (event) => {
        main.attr("transform", event.transform);
      }));

    svgRef.current = svg.node();
    const main = svg.append("g");

    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    const { nodes, links } = data;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Initialiser des positions aléatoires pour accélérer la convergence
    nodes.forEach((d: any) => {
      d.x = Math.random() * width;
      d.y = Math.random() * height;
    });

    const link = main.append("g")
      .attr("class", "links")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.weight) * 2)
      .attr("stroke", "#aaa");

    linkRef.current = link;

    const node = main.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .call(drag(simulationRef))
      .on("mouseover", function(event, d) {
        setHighlightedNode(d.id);
        d3.select(this).select("circle")
          .transition().duration(200).attr("r", 12).attr("stroke", "#000").attr("stroke-width", 2);
        d3.select(this).select("text").style("display", "block").style("font-weight", "bold");
        const tooltip = d3.select("#graph-tooltip");
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`<strong>${d.name}</strong><br/>Topic: ${d.topic}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        link.filter((l: any) => {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;
          return sourceId === d.id || targetId === d.id;
        }).attr("stroke", "#ff9900").attr("stroke-width", (d: any) => Math.sqrt(d.weight) * 3).attr("stroke-opacity", 1);
        const connectedNodeIds = new Set();
        links.forEach((l: any) => {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;
          if (sourceId === d.id) connectedNodeIds.add(targetId);
          if (targetId === d.id) connectedNodeIds.add(sourceId);
        });
        node.filter((n: any) => connectedNodeIds.has(n.id)).select("circle")
          .transition().duration(200).attr("r", 10).attr("stroke", "#ff9900").attr("stroke-width", 2);
      })
      .on("mouseout", function(event, d) {
        setHighlightedNode(null);
        d3.select(this).select("circle")
          .transition().duration(200).attr("r", 6).attr("stroke", "#fff").attr("stroke-width", 1.5);
        if (!showLabels) d3.select(this).select("text").style("display", "none").style("font-weight", "normal");
        d3.select("#graph-tooltip").transition().duration(500).style("opacity", 0);
        link.transition().duration(200).attr("stroke", "#aaa").attr("stroke-width", (d: any) => Math.sqrt(d.weight) * 2).attr("stroke-opacity", 0.4);
        node.select("circle").transition().duration(200).attr("r", 6).attr("stroke", "#fff").attr("stroke-width", 1.5);
      });

    node.append("circle")
      .attr("r", 6)
      .attr("fill", (d: any) => color(d.topic))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    node.append("text")
      .attr("dy", -10)
      .attr("text-anchor", "middle")
      .text((d: any) => d.name)
      .style("font-size", "9px")
      .style("pointer-events", "none")
      .style("display", showLabels ? "block" : "none")
      .style("text-shadow", "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff");

    node.append("title")
      .text((d: any) => `${d.name} (Topic ${d.topic})`);

    nodeRef.current = node;

    const legendTopics = [...new Set(nodes.map(node => node.topic))].sort((a, b) => a - b);
    const legendItemsPerRow = 4;
    const legendRows = Math.ceil(legendTopics.length / legendItemsPerRow);

    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 240}, 10)`);

    legend.append("rect")
      .attr("width", 230)
      .attr("height", legendRows * 20 + 10)
      .attr("fill", "white")
      .attr("stroke", "#ddd")
      .attr("rx", 5);

    legendTopics.forEach((topic, i) => {
      const row = Math.floor(i / legendItemsPerRow);
      const col = i % legendItemsPerRow;
      const legendItem = legend.append("g")
        .attr("transform", `translate(${col * 55 + 10}, ${row * 20 + 15})`);
      legendItem.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(topic));
      legendItem.append("text")
        .attr("x", 15)
        .attr("y", 8)
        .style("font-size", "8px")
        .text(`Topic ${topic}`);
    });

    simulationRef.current = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100).strength(0.1)) // Réduit la force des liens
      .force("charge", d3.forceManyBody().strength(-30)) // Réduit la répulsion
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(10));

    simulationRef.current.on("tick", () => {
      nodes.forEach((d: any) => {
        d.x = Math.max(10, Math.min(width - 10, d.x || 0));
        d.y = Math.max(10, Math.min(height - 10, d.y || 0));
      });
      link
        .attr("x1", (d: any) => d.source.x || 0)
        .attr("y1", (d: any) => d.source.y || 0)
        .attr("x2", (d: any) => d.target.x || 0)
        .attr("y2", (d: any) => d.target.y || 0);
      node.attr("transform", (d: any) => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    // Réduire l'activité de la simulation après l'initialisation
    simulationRef.current.on("end", () => {
      simulationRef.current.alphaTarget(0.05); // Maintient une légère dynamique
      console.log("Simulation stabilisée avec une faible activité");
    });

    simulationRef.current.tick(300);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
  const toggleLabels = () => setShowLabels(prev => !prev);
  const toggleStats = () => setShowStats(prev => !prev);

  const drag = (simulation: any) => {
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
      if (!event.active) simulation.alphaTarget(0.05); // Retour à une faible activité
      d.fx = null; 
      d.fy = null; 
    }
    return d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center mb-3">
        <Network className="h-5 w-5 mr-2 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">Réseau des Relations Sémantiques</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Ce graphe représente les relations sémantiques entre les espaces. Les nœuds de même couleur appartiennent au même topic, et les liens indiquent une forte similarité thématique.
      </p>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="similarity-threshold" className="text-sm font-medium text-gray-700">
            Seuil de similarité: {similarityThreshold.toFixed(2)}
          </label>
          <span className="text-xs text-gray-500">{edgeCount} connexions visibles</span>
        </div>
        <input
          id="similarity-threshold"
          type="range"
          min="0.49"
          max="0.65"
          step="0.01"
          value={similarityThreshold}
          onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.49</span>
          <span>0.65</span>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un espace..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-8 border border-gray-300 rounded text-sm"
          />
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">×</button>
          )}
        </div>
      </div>
      
      <div className="mb-3 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {nodeCount > 0 && <span>{nodeCount} espaces, {edgeCount} connexions</span>}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={toggleLabels} className="h-8 w-8 p-0" title={showLabels ? "Masquer les étiquettes" : "Afficher les étiquettes"}>
            {showLabels ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleStats} className="h-8 w-8 p-0" title={showStats ? "Masquer les statistiques" : "Afficher les statistiques"}>
            <BarChart3Icon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0" title="Réduire">
            <ZoomOutIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0" title="Agrandir">
            <ZoomInIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="relative min-h-[600px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-full h-[600px]" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        )}
        <div id="graph-relations-container" className="min-h-[600px] w-full border border-gray-200 rounded" style={{ display: isLoading ? 'none' : 'block' }}>
          {!isLoading && !error && !graphData && (
            <div className="flex items-center justify-center h-full">
              <p className="text-amber-500">Aucune donnée disponible pour le graphe.</p>
            </div>
          )}
        </div>
        <div id="graph-tooltip" className="absolute bg-black bg-opacity-80 text-white p-2 rounded text-sm pointer-events-none opacity-0" style={{ zIndex: 10 }}></div>
      </div>
      
      {showStats && networkStats && (
        <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 text-sm">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
            <BarChart3Icon className="h-4 w-4 mr-1" /> Statistiques du réseau
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-1">Structure du réseau</h5>
              <div className="space-y-1">
                <p><span className="font-medium">Nœuds :</span> {networkStats.nodeCount}</p>
                <p><span className="font-medium">Connexions :</span> {edgeCount} / {allLinks.length} (filtrées par seuil)</p>
                <p><span className="font-medium">Densité :</span> {networkStats.density.toFixed(4)}</p>
                <p><span className="font-medium">Degré moyen :</span> {networkStats.avgDegree.toFixed(2)} connexions par nœud</p>
                <p><span className="font-medium">Topics :</span> {networkStats.topicCount} groupes thématiques</p>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-1">Similarités</h5>
              <div className="space-y-1">
                <p><span className="font-medium">Seuil actuel :</span> {similarityThreshold.toFixed(2)}</p>
                <p><span className="font-medium">Similarité moyenne :</span> {networkStats.avgWeight.toFixed(3)}</p>
                <p><span className="font-medium">Similarité médiane :</span> {networkStats.medianWeight.toFixed(3)}</p>
                <p><span className="font-medium">Similarité min/max :</span> {networkStats.minWeight.toFixed(3)} / {networkStats.maxWeight.toFixed(3)}</p>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <h5 className="font-medium text-gray-700 mb-1">Espaces les plus connectés</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {networkStats.centralNodes.map((node, index) => (
                <div key={node.id} className="flex items-center text-xs">
                  <span className="font-medium mr-1">{index + 1}.</span>
                  <span className="truncate">{node.name}</span>
                  <span className="ml-1 text-gray-500">({node.degree} connexions)</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p>L'ajustement du seuil de similarité permet de filtrer les connexions les moins significatives.</p>
            <p>Les espaces ayant une similarité supérieure au seuil sont considérés comme thématiquement proches.</p>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500 italic">
        <p><MoveIcon className="inline h-3 w-3 mr-1" /> Cliquez et faites glisser les nœuds pour réorganiser le graphe.</p>
        <p>Survolez un nœud pour voir ses connexions. Les connexions plus épaisses indiquent une plus forte similarité.</p>
      </div>
    </div>
  );
};

export default RelationsGraph;