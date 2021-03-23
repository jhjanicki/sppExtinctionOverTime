import React, {useEffect, useState} from "react"
import * as d3 from "d3"
import _ from 'lodash';
import { data } from "./data"
import styled from "styled-components"
import "./index.css"
import {RangeStepInput} from 'react-range-step-input';


export const Force = () => {

    const [sppData, setSppData] = useState(data)
    const [nodes, setNodes] = useState([])
    const [year, setYear] = useState(1996)
    const [sliderVal, setSliderVal] = useState(1996)

    const handleChange = e => {
        setSliderVal(e.target.value);
        //console.log(e.target.value)
        filterData(allnodes)
    }

    //console.log(sliderVal)
    

    const overallRadius = 250;
    const width = 900;
    const height = 900;
    const padding = 1.5;
    
    const distance = 100;
    const label_dx = -60;
    const label_dy = -10;

    const unique_clusters = _.chain(sppData).map(function(d) { return d.className}).uniq().value().sort()
    const num = sppData.length
    const numClus = unique_clusters.length; // number of distinct clusters
    let clusters = new Array(numClus);
    
    const toIndex= d3.scaleOrdinal().domain(unique_clusters).range([...Array(numClus).keys()]);
    //const radiusScale = d3.scaleSqrt().domain(sizeExtent).range([minRadius, maxRadius])
    const colorScale = d3.scaleOrdinal().domain(unique_clusters)
    .range(["rgb(50,150,77)", "rgb(187,35,166)", "rgb(123,222,63)", "rgb(16,75,109)", "rgb(172,202,226)", "rgb(75,53,150)", "rgb(67,220,197)", "rgb(27,81,29)", "rgb(252,194,251)", "rgb(65,21,208)", "rgb(183,209,101)"]);
    // why are the colors changing? if the scale is based on unique_clusters then it shouldn't change even if the data is filtered

    const allnodes = sppData.map(function(d){
        var i = toIndex(d.className),
            r = 3,
            d2 = {
              cluster: d.className,
              size:d.num,
              cluster: i,
              radius: r,
              year:d.yearPublished,
              x: Math.cos(i / numClus * 2 * Math.PI) * overallRadius + width / 2 ,
              y: Math.sin(i / numClus * 2 * Math.PI) * overallRadius + height / 2
            };
        if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d2;
      
        return d2;
      })

    useEffect(() => {
        filterData(allnodes)
        //   setNodes(allnodes);
    }, []) 

    useEffect(()=>{
        setYear(+sliderVal);
    },[sliderVal])

    //console.log(year);

    useEffect(() => {

        createLabels()
      }, [])
    
    useEffect(() => {

        createSimulation()
        //createSimulationCenter()
        drawCircles()
        //console.log(nodes)
      }, [nodes]) // call functions everytime year updates?

      function createLabels(){
        const svg = d3.select("svg")
        const text = svg.selectAll("text.clusterText")
               .data(unique_clusters)
               .join("text")
               .attr("class","clusterText")
               .attr("fill","white")
               .style("font-size", 12)
               .style("font-family", "Roboto")
               .style("font-weight",600)
               .attr("x", (d,i)=> Math.cos(i / numClus * 2 * Math.PI) * (+distance+overallRadius) + width / 2)
               .attr("y", (d,i)=> Math.sin(i / numClus * 2 * Math.PI) * (+distance+overallRadius) + height /2)
               .attr("transform",`translate(${label_dx},${label_dy})`)
               .text((d,i)=>d)

      }
    
      function createSimulation() { // for the update

        const simulation = d3.forceSimulation(nodes)
        .force('collide', d3.forceCollide(d => d.radius + padding).strength(0.9))
        .force("x", d3.forceX().x(d => d.x).strength(0.2))
        .force("y", d3.forceY().y(d => d.y).strength(0.2))
        .on("tick",  () => {
            d3.selectAll("circle.spp")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", function(d) { return d.radius; });
          })

      }
      

      function createSimulationCenter() { // for the enter

        const simulation = d3.forceSimulation(nodes)
        .force('collide', d3.forceCollide(d => d.radius + padding).strength(0.9))
        .force("x", d3.forceX(0).strength(0.1))
        .force("y", d3.forceY(0).strength(0.1))
        .on("tick",  () => {
            d3.selectAll("circle.enter")
            .attr("cx", function(d) { return d.x + width/2})
            .attr("cy", function(d) { return d.y +height/2; })
            .attr("r", function(d) { return d.radius; });
          })

      }
    
    
      function filterData(data){
          
        data = data.filter(function(d){
          return d.year <= year
        })
        //console.log(data)
        setNodes(data)
      }
    
      function drawCircles() {
        const svg = d3.select("svg")

        const node = svg.selectAll("circle.spp")
        .data(nodes)
        .join(
          enter => enter.append('circle').attr("class","spp enter"),
          update => update.attr("class","spp update"),
          exit => exit.remove().attr("class","spp exit")
          )
        // .attr("class","spp")
        .attr("fill", "gray")
        .attr("r", d => d.radius)
        .style("fill", d => colorScale(d.cluster));
    
      }

      function cluster () {

        var nodes,
          strength = 0.1;
      
        function force (alpha) {
      
          // scale + curve alpha value
          alpha *= strength * alpha;
      
          nodes.forEach(function(d) {
                  var cluster = clusters[d.cluster];
              if (cluster === d) return;
      
            let x = d.x - cluster.x,
              y = d.y - cluster.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + cluster.radius;
      
            if (l != r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              cluster.x += x;
              cluster.y += y;
            }
          });
      
        }
      
        force.initialize = function (_) {
          nodes = _;
        }
      
        force.strength = _ => {
          strength = _ == null ? strength : _;
          return force;
        };
      
        return force;
      
      }

    return (
        <div>
            <RangeStepInput step = {1} min = {1996} max = {2020} value = {sliderVal} onChange={handleChange}/>
          <p></p>
          <StyledSVG />
        </div>
      )
}

const StyledSVG = styled.svg`
  width: 800px;
  height: 800px;
`