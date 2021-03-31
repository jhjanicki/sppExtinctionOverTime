import React, {useEffect, useState} from "react"
import * as d3 from "d3"
import _ from 'lodash';
import { data, sppByYear } from "./data"
import styled from "styled-components"
import "./index.css"
import {RangeStepInput} from 'react-range-step-input';


export const Force = () => {

    const [nodes, setNodes] = useState([]) //node data based on year & data
    const [year, setYear] = useState(1996) //current year
    const [sliderVal, setSliderVal] = useState(1996) // slider value
    const [cumulData, setcumulData] = useState([]) // cumulative species by year

    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false); //timer active or not

    
    //update timer & play/pause NOT WORKING... some order is messed up
    useEffect(() => { 
      let interval = null;
      if (isActive) {
        interval = setInterval(() => {

          if(year==2020){
            setSeconds(0)
            setYear(1996)
          }else{
            setSeconds(seconds => seconds + 1)
            setYear(year => year + 1)
          }

          setSliderVal(year);
          let dataByYear = sppByYear.find(d=>d.year === +year)
    
          const total = dataByYear['total'];
          const text = dataByYear['text'];
          const cumTotal = dataByYear['cumTotal'];
          
          d3.select('#year').html(year);
          d3.select('#total').html(total);
          d3.select('#cumTotal').html(cumTotal);
          d3.select('#numNewSpp').html(text);
          // filterNodes(data) 
        
        }, 1000);
      } else if (!isActive && seconds !== 0) {
        clearInterval(interval);
      }
      return () => clearInterval(interval);
    }, [isActive, seconds,year]);
  

    const overallRadius = 250;
    const width = 900;
    const height = 900;
    const padding = 1.5;

    let simulation;

    const unique_clusters = _.chain(data).map(function(d) { return d.classNameCommon}).uniq().value().sort()
    const numClus = unique_clusters.length; // number of distinct clusters
    let clusters = new Array(numClus);
    
    const toIndex= d3.scaleOrdinal().domain(unique_clusters).range([...Array(numClus).keys()]);

    const pieData = [];


    const handleSliderChange = e => {
      
      setSliderVal(e.target.value);
      let dataByYear = sppByYear.find(d=>d.year === +e.target.value)

      const total = dataByYear['total'];
      const text = dataByYear['text'];
      const cumTotal = dataByYear['cumTotal'];

      d3.select('#year').html(e.target.value);
      d3.select('#total').html(total);
      d3.select('#cumTotal').html(cumTotal);
      d3.select('#numNewSpp').html(text);
      filterNodes(data)
    }

    
  

    useEffect(() => {
        filterNodes(data)
        calculateCumulativeSpeciesByYear(data)
        createSumLabels()
    }, [year]) 
    

    useEffect(()=>{
        setYear(+sliderVal);
    },[sliderVal])

    useEffect(() => {
        createPieData()
        createArcs("classWrapper",overallRadius+70,overallRadius+90,"classArc")
        createArcs("sumWrapper",overallRadius+95,overallRadius+105,"sumArc")
        createClassLabels()
        createSimulation()
        drawCircles()
      }, [])
    
    useEffect(() => {
        createSimulation()
        drawCircles()
      }, [nodes]) // call functions everytime year updates?


      function createPieData(){
        for (let i=0; i<unique_clusters.length; i++) {
          let obj = {};
          obj['className'] = unique_clusters[i];
          obj['value'] = 1;
          pieData.push(obj);
      }
    }


      function toggle() {
        setIsActive(!isActive);
      }
  
      function reset() {
        setSeconds(0);
        setIsActive(false);
        setYear(0);
        setSliderVal(1996);
      }


      function createArcs(className, innerRadius, outerRadius, arcClassName){

        const svg = d3.select("svg")
        const g = svg.append("g")
        .attr("class",className)
        .attr("transform",`translate(${width/2},${height/2})`);

        const pie = d3.pie()
        .startAngle(83 * Math.PI/180)
        .endAngle(83 * Math.PI/180 + 2*Math.PI)
        .value(d=>d.value)
			  .padAngle(.01)(pieData)
      

        const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
  
        g.selectAll(`path.${arcClassName}`)
          .data(pie)
          .join("path")
          .attr("class", arcClassName)
          .attr("id", (d,i) => `${arcClassName}_${i}`) //Unique id for each slice
          .attr("stroke", "none")
          .attr("fill", "none")
          .attr("d", arc);
          
      }

      function createClassLabels(){

        const svg = d3.select("svg")
        const g = svg.select("g.classWrapper")

        g.selectAll("text.arcText")
        .data(pieData)
        .join("text")
        .attr("class", "arcText")
        .append("textPath")
        .style("font-size", 10)
        .style("font-family", "Roboto")
        .style("font-weight",600)
        .attr("fill", "white")
        .attr("xlink:href",(d,i)=> `#classArc_${i}`)
        .text(d=>d.className);

      }

      function createSumLabels(){

        const svg = d3.select("svg")
        const g = svg.select("g.sumWrapper")

        g.selectAll("text.arcText")
        .data(cumulData)
        .join("text")
        .attr("class", "arcText")
        .append("textPath")
        .style("font-size", 10)
        .style("font-family", "Roboto")
        .style("font-weight",600)
        .attr("fill", "white")
        .attr("xlink:href",(d,i)=> `#sumArc_${i}`)
        .text(d=>d.sum)
        
      }

      
    
      function createSimulation() { // for the update

        simulation = d3.forceSimulation(nodes)
        .force('collide', d3.forceCollide(d => d.radius + padding).strength(0.9))
        .force("x", d3.forceX().x(d => d.x).strength(0.1))
        .force("y", d3.forceY().y(d => d.y).strength(0.1))
        .alphaDecay(0.038)
        .on("tick",  () => {
            d3.selectAll("circle.spp")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
            
          })
          

      }
      
    

      function filterNodes(data){

        const data1 = data.filter(function(d){
            return d.yearPublished == year
         })

         const data2 = data.filter(function(d){
            return d.yearPublished != year && d.yearPublished < year
         })

         const nodes1 = data1.map(function(d){
            var i = toIndex(d.classNameCommon),
                r = 3,
                d2 = {
                  cluster: d.classNameCommon,
                  size:d.num,
                  cluster: i,
                  radius: r,
                  year:d.yearPublished,
                  x:  width / 2 ,
                  y:  height / 2,
                  check: "center",
                  color: d.color
                };
            if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d2;
          
            return d2;
          })

          const nodes2 = data2.map(function(d){
            var i = toIndex(d.classNameCommon),
                r = 3,
                d2 = {
                  cluster: d.classNameCommon,
                  size:d.num,
                  cluster: i,
                  radius: r,
                  year:d.yearPublished,
                  x: Math.cos(i / numClus * 2 * Math.PI) * overallRadius + width / 2 ,
                  y: Math.sin(i / numClus * 2 * Math.PI) * overallRadius + height / 2,
                  check: "cluster",
                  color: d.color
                };
            if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d2;
          
            return d2;
          })

          const nodes3 = [...nodes1, ...nodes2];
          
          setNodes(nodes3)

      }
    
      function drawCircles() {
        const svg = d3.select("svg")

        svg.selectAll("circle.spp")
        .data(nodes, d=>d.scientificName)
        .join("circle")
        .attr("class","spp")
        .attr("r", d => d.radius)
        .attr("fill", function(d){
          return d.color;
        });
    
      }

      function calculateCumulativeSpeciesByYear(data){

        const dataBeforeYear = data.filter(function(d){
          return d.yearPublished <=year
       })

       var extinctSppCum =
          _(dataBeforeYear)
            .groupBy('classNameCommon')
            .map((objs, key) => ({
                'className': key,
                'sum': _.sumBy(objs, 'num') }))
            .value();

          console.log(extinctSppCum)

         let classNameArray = [];
       
         for(let i=0;i<extinctSppCum.length;i++){
          classNameArray.push(extinctSppCum[i].className)
         }
         //console.log(classNameArray)

         let classNotInArray = unique_clusters.filter(x => !classNameArray.includes(x));
         //console.log(classNotInArray)
         

          for(let i=0;i<classNotInArray.length;i++){
            let newClassObj = {};
            newClassObj.className = classNotInArray[i]
            newClassObj.sum = 0
            extinctSppCum.push(newClassObj);
          }

          const result = _(extinctSppCum)
          .sortBy('className') // sort by name
          .value();

          setcumulData(result)

          console.log(result)
  
      }


    return (
        <div>
            <div id="textArea">
              <button className={`button button-primary button-primary-${isActive ? 'active' : 'inactive'}`} onClick={toggle}>
                {isActive ? 'Pause' : 'Start'}
              </button>
              <RangeStepInput id="slider" step = {1} min = {1996} max = {2020} value = {sliderVal} onChange={handleSliderChange}/>
              <p id="yearWrap"> <b>Year:</b> <span id="year">1996</span></p>
              <p id="totalWrap"><b>Extinct species this year: </b> <span id="total">231</span></p>
              <p id="cumTotalWrap"><b>Total extinct species:</b> <span id="cumTotal">231</span></p>
              <p id="numNewSpp">Bivalves	1, Gastropods	166, Insects	42, Malacostracan crustaceans	2, Maxillopods	2, Ostracods	2, Planarians	1, Ray-finned fishes	6, Reptiles	9 </p>
            </div>
          <StyledSVG />
        </div>
      )
}

const StyledSVG = styled.svg`
  width: 900px;
  height: 900px;
`