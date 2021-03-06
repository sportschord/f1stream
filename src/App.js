import './App.css';
import * as d3 from 'd3'
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useEffect, useRef, useState } from 'react';
import teamcols from './teamcols.json'
import streams from './f1stream.csv'
import positions from './positions.csv'

function App() {

  const [newdat, setNewData] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState("2010-2021")
  const ref = useRef();

  // first useEffect to get data from csv
  
  useEffect(() => {

    Promise.all([
      d3.csv(streams),
      d3.csv(positions)
    ]).then((d) => {
      return (
        setNewData(d[0]),
        setPos(d[1])
      )
    }).then(() =>
      setLoading(false)
    )
  }, [])

  const handleSelect = (e) => setSelectedOption(e.target.value)

  // get the different periods from points csv
  var period = new Set(pos.map(d => d.period))
  
  //accessor functions
  var points = d => d.points
  var teams = d => d.team
  var season = d => d.season

  let merged = [];

  for (let i = 0; i < newdat.length; i++) {
    merged.push({
      ...newdat[i],
      ...(pos.filter(d=>d.period===selectedOption).find((d) => d.position === newdat[i].position))
    }
    );
  }
  
  var dat = merged.map(a =>
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
  
  
      
  var conpoints = d3.flatRollup(dat, v => d3.sum(v, points), teams).map(d => ({ team: d[0], points: d[1] }));
  var sortedcons = conpoints.slice().sort((a, b) => d3.descending(a.points, b.points));
  sortedcons = sortedcons.filter(d => d.points > 0);



  console.log(sortedcons.filter(d => d.points > 0));
  
  var seaspoints = d3.flatRollup(dat, v => d3.sum(v, points), season).map(d => ({ season: d[0], points: d[1] }));
  var maxpoints = d3.max(seaspoints.map(d => d.points));

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


  var keys = sortedcons.map(d => d.team)
  
  console.log(keys);

  let winwidth = window.innerWidth;

  var margins = 50

  var margin = { top: margins, right: margins, bottom: 0, left: margins },
    width = winwidth - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;
  
    

  var maxdom = maxpoints/2
  
    
    
  var xScale = d3.scaleLinear().domain(d3.extent(seasons)).range([0, width])
  var yScale = d3.scaleLinear().domain([-maxdom, maxdom]).range([height, 0])
  
  var stackedData = d3.stack()
  .offset(d3.stackOffsetSilhouette)
  .keys(keys)
  (newm)
  
  var area = d3.area()
  .x(d => xScale(d.data.season))
  .y0(d => yScale(d[0]))
  .y1(d => yScale(d[1]))
  .curve(d3.curveCardinal);
  
  useEffect(() => {
    
    if (newm) {
      
      
      var svg = d3.select(ref.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
      
      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = (d, e) => {
        Tooltip.style("opacity", 1)
        d3.selectAll(".myArea")
          .style("opacity", .1)
        d3.selectAll("circle")
          .style("opacity", .1)
        d3.selectAll("text")
          .style("opacity", .1)
        d3.selectAll("text." + d.path[0].id)
          // .transition().duration(100)
          .style("opacity", 1)
        d3.select("circle." + d.path[0].id)
          // .transition().duration(300)
          .style("opacity", 1)
        d3.select("#" + d.path[0].id)
          .style("stroke", "black")
          .style("opacity", 1)

      }

      var mouseleave = (d) => {
        Tooltip.style("opacity", 0)
        d3.selectAll(".myArea")
          .style("opacity", 1)
          .style("stroke", "none")
        d3.selectAll("circle")
          .style("opacity", 1)
        d3.selectAll("text")
          .style("opacity", 1)
      }

      var Tooltip = svg
        .append("text")
        .attr("x", 50)
        .attr("y", 50)
        .style("opacity", 0)
        .style("color", "white")
        .style("font-size", 17)

      
    
      // Show the areas
      svg.selectAll("mylayers")
        .data(stackedData)
        .enter()
        .append("path")
              .attr("d", area)
              .attr("class", "myArea")
              .style("fill", d => teamcols[d.key])
              .attr("id", d => d.key.replace(/ /g, ""))
              .on("mouseover", mouseover)
              .on("mouseleave", mouseleave)         
      
      }
      
    },
    
    [loading]);
    
    
  // second useEffect to transtion the data when user changes the points filter
  
  useEffect(() => {

      d3.select(ref.current)
        .selectAll("path")
        .data(stackedData)
        .attr("id", d => d.key.replace(/ /g, ""))
        .transition()
        .ease(d3.easeCubicIn)
        // .delay(500)
        .duration(1000)
        .attr("d", area)
        .style("fill", d => teamcols[d.key])
        
    
  },[selectedOption])
  
  var cols = 9
  var gap = width / cols




  return (
    <div className="App">
      <header className="App-header">

        {loading ? <p>loading</p> :
          <div>
            <h3>Formula 1 Constructors</h3>
            <h5 className='subtitle'>POINTS SYSTEM</h5>
            <div>
              {/* <Box sx={{ minWidth: 120 }}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">Points System</InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={selectedOption}
                    label={selectedOption}
                    onChange={handleSelect}
                  >
                    {[...period].map(d =>
                      <MenuItem value={d}>{d}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box> */}
              
              <select onChange={handleSelect} value={selectedOption} className='select'>
                {[...period].map(d =>
                  <option value={d} key={d} className='option'>
                  {d}
                  </option>)}  
              </select>
                  </div>
            {/* <div>
              {pos.filter(d=>d.period===selectedOption).map(d =>
                <p fill="white" style={{ fontSize: "9px" }} key={d.position}>{d.position} : {d.points}</p>)}
            </div> */}

          </div>
        }
          
        
        <svg ref={ref} width={width} height={height}>
          <text fill='white' x={50} y={330} fontSize={10}>Size of stream represents number of points</text>
          <text fill='white' x={40} y={150} fontSize={10}>1950</text>
          <text fill='white' x={width + 30} y={42} fontSize={10}>2021</text>
        </svg>
            
          
        <svg width={width}>
          {sortedcons?.map((d, i) =>
            <g key={d.team + i}>
              <circle
                key={d.team + i}
                id={d.team.replace(/ /g, "")}
                className={d.team.replace(/ /g, "")}
                cx={margins/2 + (i % cols) * (gap)}
                cy={20 + (Math.floor(i / cols)) * 20}
                r={5}
                fill={teamcols[d.team]}
              >
              </circle>
              <text
                x={margins/2 + (i % cols) * (gap) + 10}
                y={3 + (20 + (Math.floor(i / cols)) * 20)}
                fontSize={9}
                className={d.team.replace(/ /g, "")}
                fill={"white"}
              >
                {d.team} 
              </text>

              {winwidth > 1500 ?
                <text
                  x={margins / 2 + (i % cols) * (gap) + 92}
                  y={3 + (20 + (Math.floor(i / cols)) * 20)}
                  fontSize={9}
                  className={d.team.replace(/ /g, "")}
                  fill={"#d3d3d3"}
                >
                  {d.points.toLocaleString("en-US")}
                </text> : ""}
            </g>
          )}
        </svg>
      </header>
    </div>
  );
}

export default App;
