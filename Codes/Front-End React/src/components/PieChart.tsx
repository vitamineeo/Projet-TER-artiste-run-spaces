import React, { useEffect } from 'react';
import responsesData from '../data/reponses_stats.json'; // <- Import direct du JSON
import * as d3 from 'd3';


const PieChart = () => {
  useEffect(() => {
    if (document.getElementById('pieChart')) {
      initPieChart(responsesData);
    }
  }, []);

  const initPieChart = (data: { [key: string]: number }) => {
    const width = 300, height = 300, radius = Math.min(width, height) / 2;

    const existingSvg = d3.select("#pieChart");
    existingSvg.selectAll("*").remove();

    const svg = existingSvg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(Object.keys(data))
      .range(["#4CAF50", "#FF5733"]);

    const data_ready = Object.entries(data).map(([key, value]) => ({
      name: key,
      value: value
    }));

    const pie = d3.pie<any>().value(d => d.value);
    const arc = d3.arc<any>().innerRadius(0).outerRadius(radius);

    svg.selectAll("path")
      .data(pie(data_ready))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.name))
      .attr("stroke", "black")
      .style("stroke-width", "2px");

    svg.selectAll("text")
      .data(pie(data_ready))
      .enter()
      .append("text")
      .text(d => `${d.data.name}: ${d.data.value}`)
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "white");
  };

  return <svg id="pieChart" className="mx-auto"></svg>;
};

export default PieChart;
