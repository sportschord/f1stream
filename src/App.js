import './App.css';
import * as d3 from 'd3'
import teamcols from './teamcols.json'
import { useEffect, useRef, useState } from 'react';

function App() {

  const [newdat, setNewData] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef();

  useEffect(() => {

    Promise.all([
      d3.csv("/f1stream.csv"),
      d3.csv("/positions.csv")
    ]).then((d) => {
      
      return (
        
        setNewData(d[0]),
        setPos(d[1])
        )
        
    }).then(() =>
        
      setLoading(false)

      )
    
  }, [])

  var period = new Set(pos.map(d=>d.period))
  
  var points = d => d.points
  var teams = d => d.team
  var season = d => d.season

  
  
  var dat = newdat.map(a =>
    ({
      constructor: a.constructor,
      season: a.season,
      points: a.points * a.count
    }));
    
    
    //sum points per constructor per season
    dat = d3.flatRollup(dat,
      v => d3.sum(v, points),
      d => d.season,
      d => d.constructor)
      
      
      // flattens data to array of objects
      dat = dat.map(d => ({
        season: d[0],
        team: d[1],
        points: d[2]
        
      }));
  
  console.log(d3.max(dat.map(d=>d.points)));
      
  var conpoints = d3.flatRollup(dat, v => d3.sum(v, points), teams).map(d => ({ team: d[0], points: d[1] }));

  
  var sortedcons = conpoints.slice().sort((a, b) => d3.descending(a.points, b.points))
  // sortedcons = sortedcons.map(d => d.points > 100 ? { team: d.team } : { team: 'Others' });

  var cons = sortedcons.map(d => d.team)
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

  

  
  // var keys = dataset.columns?.slice(2, dataset.length)
  var keys = [...cons]
  
  console.log(keys);

  let winwidth = window.innerWidth;

  var margins = 50

  var margin = { top: margins, right: margins, bottom: 0, left: margins },
    width = winwidth - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;
  
  var maxdom = 1200

  var xScale = d3.scaleLinear().domain(d3.extent(seasons)).range([0, width])
  var yScale = d3.scaleLinear().domain([-maxdom, maxdom]).range([height, 0])

  
  useEffect(() => {

    async function init() {

      // let data = await dataset

      let data = await newm

      console.log(newm);

      // data = datatemp.map(({ position, ...item }) => item)

      var svg = d3.select(ref.current)
        // .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
     
      var stackedData = d3.stack()
          .offset(d3.stackOffsetSilhouette)
          .keys(keys)
          (data)
      
      

      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = (d) => {
        Tooltip.style("opacity", 1)
        d3.selectAll(".myArea")
          .style("opacity", .1)
        // d3.selectAll("circle")
        //   .style("opacity", .1)
        d3.select("#"+d.path[0].id)
          .style("stroke", "black")
          .style("opacity", 1)
        console.log(d3.select(d.id));
        console.log(d.path[0].id);
      }
      var mousemove = function (d, i) {
        var grp = keys[i]
        Tooltip.text(grp)
      }
      var mouseleave = (d) => {
        Tooltip.style("opacity", 0)
        d3.selectAll(".myArea")
          .style("opacity", 1)
          .style("stroke", "black")
        d3.selectAll("circle")
          .style("opacity", 1)
      }

      var Tooltip = svg
        .append("text")
        .attr("x", 10)
        .attr("y", 10)
        .style("opacity", 0)
        .style("color", "white")
        .style("font-size", 17)

      
      var area = d3.area()
        .x(d => xScale(d.data.season))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveCardinal);
    
        // Show the areas
        svg.selectAll("mylayers")
          .data(stackedData)
          .enter()
          .append("path")
          .attr("class", "myArea")
          .style("fill", d => teamcols[d.key])
          // .style("stroke", "black")
          .attr("id",d => d.key.replace(" ",""))
          .attr("d", area)
          .on("mouseover", mouseover)
          // .on("mousemove", mousemove)
          .on("mouseleave", mouseleave)


    }
    
      init()
    
      
    }, [loading]);

  
    var cols = 9
    var gap = width / cols


  return (
    <div className="App">
      <header className="App-header">
        
        {loading ? <p>loading</p> :
          <div>
            <p>Formula 1 Constructors <br/> 1950-2021</p>
            {/* <select>
              {[...period].map(d => <option value={d} key={d}>{d}</option>)}  
            </select> */}
          </div>
        }
        <svg ref={ref} width={width} height={height}>
          <text fill='white' x={50} y={330} fontSize={10}>Size of stream represents number of points</text>
          <text fill='white' x={40} y={150} fontSize={10}>1950</text>
          <text fill='white' x={width+30} y={50} fontSize={10}>2021</text>
        </svg>
        {/* <text>{Tooltip}</text> */}

        <svg width={width}>          
          {keys?.map((d, i) =>
            <g key={d + i}>
            <circle
                key={d + i}
                id={d.replace(" ", "")}
                className={d.replace(" ", "")}
                cx={margins+(i % cols) * (gap)}
                cy={20 + (Math.floor(i/cols))*20}
                r={5}
                fill={teamcols[d]}
                // stroke={'white'}
              >
              </circle>
              <text
                x={margins + (i % cols) * (gap) + 10}
                y={3 + (20 + (Math.floor(i / cols)) * 20)}
                fontSize={10}
              fill={"white"}
              >
                {d}
              </text>
            </g>
          )}
        </svg>
      </header>
    </div>
  );
}

export default App;
