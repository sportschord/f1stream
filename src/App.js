import './App.css';
import * as d3 from 'd3'
import teamcols from './teamcols.json'
import { useEffect, useRef, useState } from 'react';

function App() {

  const [dataset, setData] = useState([]);
  const [newdat, setNewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef();

  useEffect(() => {

    d3.csv("/f1stream.csv")
      .then((d) => {
        setNewData(d)
        // setLoading(false)
      })
    
  }, [])
  
  var points = d => d.points
  var teams = d => d.team
  var season = d => d.season
  
  

  var sample = newdat
  var dat = sample.map(a =>
  ({
    constructor: a.constructor,
    season: a.season,
    points: a.points * a.count
  }));

  dat = d3.flatRollup(dat,
    v => d3.sum(v, points),
    d => d.season,
    d => d.constructor)

  dat = dat.map(d => ({
    season: d[0],
    team: d[1],
    points: d[2]

  }));

  console.log('dat', dat);

  var cons = Array.from(new Set(dat.map(teams)));
  var seasons = Array.from(new Set(dat.map(season)));
 
  var newm = [];

  
  for (const season of seasons) {
    newm.push({
      season: season,
    })
  }

  for (let i = 0; i < newm.length; i++) {
    for (let item of cons) newm[i][item] = null
    
  }

  for (var year in seasons) {
    let a = seasons[year];
    let seasonData = dat.filter(d => d.season === a);
    
    
    for (let j = 0; j < seasonData.length; j++) {
      let cons = seasonData.map(d => d.team)[j]
      newm[year][cons]=seasonData[j].points  
    }

  }

  console.log(newm);
  
  
  
  
  
  
  
  useEffect(() => {

    d3.csv("/f1posstreamformat.csv")
      .then((d) => {
        setData(d)
        setLoading(false)
      })
    
  }, [])

  
  console.log('dataset: ',dataset.slice(600,620));
  var keys = dataset.columns?.slice(2, dataset.length)
  // var keys = [...cons]
  
  console.log(keys);
  console.log(dataset.columns?.slice(2, dataset.length));
  console.log(newm?.slice(1, newm.length));

  // console.log(seasons);

  let winwidth = window.innerWidth;

  var margin = { top: 20, right: 40, bottom: 0, left: 40 },
    width = winwidth - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
  
  var maxdom = 2000

  var xScale = d3.scaleLinear().domain([1950, 2023]).range([0, width])
  var yScale = d3.scaleLinear().domain([-maxdom, maxdom]).range([height, 0])


  // let datatemp = dataset.slice(0,15)

  // useEffect(() => {
  
  // redo this to use dataset not datatemp
    
  // keys?.forEach((element, i) => {
    
  //     datatemp = datatemp.map(a => 
  //       ({ ...a, [element]: a[element] * a.position || 0 })
  //     );
    
      
      
  // });


  
  useEffect(() => {

    async function init() {

      // let data = await dataset

      let data = await newm

      // data = datatemp.map(({ position, ...item }) => item)

      var svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
      

      console.log('keys ', keys);

      var teamcolors = ["#DC0000", "#FF8700", "#FFFFFF", "#0600EF",
        "#00D2BE", "#FFD800", "#FFB800", "#2e3192", "#9B0000",
        "#3266ba", "#F596C8", "#eea312", "#d3d3d3", "#004225", "#990000"
        , "#ff6600", "#469BFF", "#ffa219", "#03dbfc", "#d3d3d3", "#bb0a1e",
        "#d3d3d3", "#d3d3d3", "#9B0000", "#FFB800", "#d3d3d3"]
      
    
      var color = d3.scaleOrdinal()
        .domain(keys)
        .range([...teamcolors,
          ..."#d3d3d3".repeat(keys.length - teamcolors.length)]);
     
      var stackedData = d3.stack()
          .offset(d3.stackOffsetSilhouette)
          .keys(keys)
          (data)
      
      var Tooltip = svg
        .append("text")
        .attr("x", 10)
        .attr("y", 10)
        .style("opacity", 0)
        .style("color","white")
        .style("font-size", 17)

      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = (d) => {
        Tooltip.style("opacity", 1)
        d3.selectAll(".myArea").style("opacity", .2)
        d3.select(this)
          .style("stroke", "black")
          .style("opacity", 1)
      }
      var mousemove = function (d, i) {
        var grp = keys[i]
        Tooltip.text(grp)
      }
      var mouseleave = function (d) {
        Tooltip.style("opacity", 0)
        d3.selectAll(".myArea")
          .style("opacity", 1)
          .style("stroke", "black")
      }
      
      var area = d3.area()
        .x(d => xScale(d.data.season))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveCardinal);
    
        // Show the areas
        svg.selectAll("mylayers")
          .data(stackedData)
          .join("path")
          .attr("class", "myArea")
          .style("fill", d => color(d.key))
          .style("stroke", "black")
          .attr("id",d => d.key)
          .attr("d", area)
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseleave", mouseleave)
      
    }
    
    

      init()

    //   var keys = Object.keys(data[0])

    //   keys.forEach(key => {
    //     if (key !== "season") {
    //       var consArea = d3.line()
    //         .x(d => xScale(parseFloat(d.season)))
    //         .y(d => yScale(d[key]))
    //         .curve(d3.curveCardinal);

    //       svg.append("path")
    //         .attr("id", key + "Area")
    //         .attr("d", consArea(data))
    //         .style("fill", "none")
    //         .style("stroke", "black")
        
    //     }
    //   }) 
    // }

    // init()
    
      
    }, [loading]);

  
  var gap = width / 10


  return (
    <div className="App">
      <header className="App-header">

        {loading ? <p>loading</p> : <p>Formula 1 Constructors</p>}
          <svg ref={ref} width={width} height={height}></svg>
        {/* {[...cons].filter(d => d.includes('McLaren')).map(d => <p>{d}</p>)} */}

        <svg width={width}>

          {loading ? <p>loading</p> :
            keys.map((d, i) =>
              <g key={d + i}>
                <circle
                  key={d + i}
                  cx={20+ (i < 10 ? gap * i : (gap * i) - gap * 10)}
                  cy={i < 10 ? 10 : 40}
                  r={5}
                  fill={teamcols[i]?.Colour}
                  stroke={'white'}>
                </circle>
                <text
                  x={20+ (i < 10 ? (gap * i) : (gap * i) - gap * 10)+10}
                  y={3+(i < 10 ? 10 : 40)}
                  fontSize={10}
                  fill={"white"}>{d}
                </text>
            </g>)}
          
        </svg>

        

      </header>
    </div>
  );
}

export default App;
