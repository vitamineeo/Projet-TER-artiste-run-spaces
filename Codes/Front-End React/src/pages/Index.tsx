
import React, { useEffect, useRef } from 'react';
import { MapPin, PieChart, Book, Users, Network, GitBranch, FileText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  // D3.js et autres scripts seront initialisés ici
  useEffect(() => {
    // Charger les scripts nécessaires
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadStyles = () => {
      const style = document.createElement('style');
      style.textContent = `
        .tooltip {
          position: absolute;
          padding: 10px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          pointer-events: none;
          font-size: 14px;
          box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }
        .tooltip-title {
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }
        .tooltip-info {
          color: #666;
          font-size: 12px;
          text-align: left;
          line-height: 1.4;
        }
        .tooltip-info div {
          margin: 2px 0;
        }
        .location-point {
          fill: #e41a1c;
          opacity: 0.7;
        }
        .location-point:hover {
          opacity: 1;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    };

    const initScripts = async () => {
      try {
        loadStyles();
        await Promise.all([
          loadScript('https://code.jquery.com/jquery-3.6.0.min.js'),
          loadScript('https://d3js.org/d3.v7.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js')
        ]);
        console.log('Scripts loaded successfully');
        initMap();
        initPieChart();
        initTopics();
        initSemanticGraph();
      } catch (error) {
        console.error('Script loading error:', error);
      }
    };

    initScripts();
  }, []);

  // Initialisation de la carte
  const initMap = () => {
    if (window.d3 && document.getElementById('map1')) {
      const createMap = (containerId) => {
        const container = document.querySelector(containerId);
        if (!container) return;
        
        const width = container.offsetWidth;
        const height = width * 0.6;

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

        // Chargement des données (simulées ici, remplacer par vos vraies données)
        Promise.all([
          window.d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
          // Simulation de vos données, à remplacer par le vrai chemin
          Promise.resolve([
            { nom: "Espace A", ville: "Paris", pays: "France", longitude: 2.3522, latitude: 48.8566, website: "http://example.com" },
            { nom: "Espace B", ville: "Berlin", pays: "Allemagne", longitude: 13.4050, latitude: 52.5200, website: "http://example.com" },
            { nom: "Espace C", ville: "New York", pays: "États-Unis", longitude: -74.0060, latitude: 40.7128, website: "http://example.com" }
          ])
        ]).then(([world, spacesData]) => {
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

          g.selectAll("circle")
            .data(spacesData)
            .enter()
            .append("circle")
            .attr("class", "location-point")
            .attr("cx", d => projection([d.longitude, d.latitude])[0])
            .attr("cy", d => projection([d.longitude, d.latitude])[1])
            .attr("r", 5)
            .on("mouseover", (event, d) => {
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
            .on("mousemove", (event) => {
              tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
              tooltip.style("display", "none");
            });
        }).catch(error => {
          console.error('Error loading map data:', error);
        });

        window.addEventListener("resize", () => {
          const newWidth = container.offsetWidth;
          const newHeight = newWidth * 0.6;

          svg.attr("width", "100%").attr("height", newHeight);
          projection.scale(newWidth / 5).translate([newWidth / 2, newHeight / 2]);

          svg.selectAll("path").attr("d", path);
          svg.selectAll("circle")
            .attr("cx", d => projection([d.longitude, d.latitude])[0])
            .attr("cy", d => projection([d.longitude, d.latitude])[1]);
        });
      };

      createMap("#map1");
    }
  };

  // Initialisation du graphique circulaire
  const initPieChart = () => {
    if (window.d3 && document.getElementById('pieChart')) {
      // Simulation de vos données, à remplacer par le vrai chargement
      const data = { "Oui": 75, "Non": 25 };

      const width = 300, height = 300, radius = Math.min(width, height) / 2;
      
      const svg = window.d3.select("#pieChart")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
      
      const color = window.d3.scaleOrdinal()
        .domain(Object.keys(data))
        .range(["#4CAF50", "#FF5733"]);

      const data_ready = Object.entries(data).map(([key, value]) => ({
        name: key,
        value: value
      }));

      const pie = window.d3.pie().value(d => d.value);
      
      const arc = window.d3.arc().innerRadius(0).outerRadius(radius);
      
      svg.selectAll("path")
        .data(pie(data_ready))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

      svg.selectAll("text")
        .data(pie(data_ready))
        .enter()
        .append("text")
        .text(d => `${d.data.name}: ${d.data.value}%`)
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "white")
        .style("font-weight", "bold");
    }
  };

  // Initialisation des visualisations de topics
  const initTopics = () => {
    // Simulation du chargement des données topics
    console.log('Topic visualizations would be initialized here');
    // Cette partie serait à adapter selon vos besoins spécifiques
  };

  // Initialisation du graphe sémantique
  const initSemanticGraph = () => {
    if (window.d3 && document.getElementById('graph-relations-container')) {
      const width = document.getElementById('graph-relations-container').offsetWidth;
      const height = 500;

      const svg = window.d3.select("#graph-relations-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      // Simulation de données pour le graphe (à remplacer par vos vraies données)
      const nodes = [
        { id: "space1", name: "Espace 1", topic: 1 },
        { id: "space2", name: "Espace 2", topic: 2 },
        { id: "space3", name: "Espace 3", topic: 1 },
        { id: "space4", name: "Espace 4", topic: 3 },
        { id: "space5", name: "Espace 5", topic: 2 }
      ];
      
      const links = [
        { source: "space1", target: "space2", weight: 0.8 },
        { source: "space1", target: "space3", weight: 0.6 },
        { source: "space2", target: "space4", weight: 0.4 },
        { source: "space3", target: "space5", weight: 0.7 },
        { source: "space4", target: "space5", weight: 0.5 }
      ];

      const color = window.d3.scaleOrdinal(window.d3.schemeCategory10);

      const simulation = window.d3.forceSimulation(nodes)
        .force("link", window.d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", window.d3.forceManyBody().strength(-300))
        .force("center", window.d3.forceCenter(width / 2, height / 2));

      const link = svg.selectAll("line")
        .data(links)
        .enter().append("line")
        .style("stroke", "#aaa")
        .style("stroke-width", d => d.weight * 2);

      const node = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 10)
        .attr("fill", d => color(d.topic))
        .call(drag(simulation));

      const label = svg.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("dy", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "black")
        .text(d => d.name);

      simulation.on("tick", () => {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        label
          .attr("x", d => d.x)
          .attr("y", d => d.y);
      });

      function drag(simulation) {
        function dragStarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        }

        function dragEnded(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }

        return window.d3.drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-[#f7f9fc]">
      {/* Header avec design moderne */}
      <header className="relative mb-10">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Artist Run Spaces</h1>
          <p className="text-lg opacity-90">Exploration et analyse des espaces artistiques indépendants</p>
        </div>
      </header>

      {/* Section Carte du Monde */}
      <section className="mb-12">
        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-6">
            <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
              <MapPin className="mr-2 h-6 w-6" />
              Cartographie des Artist Run Spaces
            </h2>
            <div id="map1" className="w-full h-[400px] bg-gray-100 rounded-lg"></div>
          </CardContent>
        </Card>
      </section>

      {/* Section Enquête */}
      <section className="mb-12">
        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-6">
            <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
              <Users className="mr-2 h-6 w-6" />
              Enquête auprès des Espaces
            </h2>
            
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
              </div>
              
              <div className="flex justify-center items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center justify-center">
                    <PieChart className="mr-2 h-5 w-5" />
                    Espaces considérés comme œuvres
                  </h3>
                  <svg id="pieChart" className="mx-auto"></svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section Topics */}
      <section className="mb-12">
        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-6">
            <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
              <Book className="mr-2 h-6 w-6" />
              Extraction et répartition des topics
            </h2>
            
            <Tabs defaultValue="visualization" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="visualization">Visualisation des Topics</TabsTrigger>
                <TabsTrigger value="distribution">Distribution par Espaces</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visualization" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div id="topic-visualization-container" className="min-h-[400px]">
                  {/* Ce conteneur sera rempli par les visualisations chargées via D3 */}
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Chargement de la visualisation des topics...</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="distribution" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div id="topic-distribution-container" className="min-h-[400px]">
                  {/* Ce conteneur sera rempli par les visualisations chargées via D3 */}
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Chargement de la distribution des topics...</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Le graphique interactif de type Sunburst te permet de visualiser la répartition des topics dans tes données, avec des informations sur le nombre de documents par topic et les mots-clés associés.</li>
                <li>Barplot est créé pour visualiser la répartition des topics, en termes de pourcentage de documents associés à chaque topic.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section Analyse détaillée */}
      <section className="mb-12">
        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-6">
            <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
              <FileText className="mr-2 h-6 w-6" />
              Analyse détaillée des topics
            </h2>
            
            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="documents">Documents par topic</TabsTrigger>
                <TabsTrigger value="intertopic">Intertopic distance</TabsTrigger>
                <TabsTrigger value="hierarchy">Topic hierarchy</TabsTrigger>
                <TabsTrigger value="distribution">Topic distribution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="documents" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div id="visualization-document-container" className="min-h-[400px]">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Chargement de la visualisation des documents...</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="intertopic" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div id="visualization-intertopic-container" className="min-h-[400px]">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Chargement de la carte de distance intertopique...</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="hierarchy" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div id="visualization-hierarchy-container" className="min-h-[400px]">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Chargement de la hiérarchie des topics...</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="distribution" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div id="visualization-distribution-container" className="min-h-[400px]">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Chargement de la distribution des topics...</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Section Graphe des Relations */}
      <section className="mb-12">
        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-6">
            <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
              <Network className="mr-2 h-6 w-6" />
              Graphe des Relations Sémantiques
            </h2>
            
            <div id="graph-relations-container" className="min-h-[500px] bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Chargement du graphe des relations sémantiques...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-600 pb-8">
        <Separator className="mb-6" />
        <p>© 2025 Artist Run Spaces — Tous droits réservés</p>
      </footer>
    </div>
  );
};

export default Index;
