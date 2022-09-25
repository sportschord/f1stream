import './App.css';
import * as d3 from 'd3'
import html2canvas from 'html2canvas';
import { useEffect, useRef, useState } from 'react';
import teamcols from './teamcols.json'
import streams from './f1stream.csv'
// import grouped from './f1streamgroups.csv'
import grouped from './f1streamsorted.csv'
import f1keysdata from './keys.csv'
// import positions from './positions.csv'

function App() {

  const [newdat, setNewData] = useState([]);
  // const [pos, setPos] = useState([]);
  const [data, setData] = useState([]);
  const [f1keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState("2010-2021")
  const ref = useRef();
  const printRef = useRef();

  const handleDownloadImage = async () => {
    const element = printRef.current;
    const canvas = await html2canvas(element, {scale:30});

    const data = canvas.toDataURL('image/png');
    const link = document.createElement('a');

    if (typeof link.download === 'string') {
      link.href = data;
      link.download = 'streamgraph.png';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(data);
    }
  };


  // first useEffect to get data from csv

  useEffect(() => {

    Promise.all([
      d3.csv(streams),
      // d3.csv(positions),
      d3.csv(grouped),
      d3.csv(f1keysdata),

    ]).then((d) => {
      return (
        setNewData(d[0]),
        // setPos(d[1]),
        setData(d[1]),
        setKeys(d[2])
      )
    }).then(() =>
      setLoading(false)
    )
  }, [])


  const handleSelect = (e) => setSelectedOption(e.target.value)

  // get the different periods from points csv
  // var period = new Set(pos.map(d => d.period))

  //accessor functions
  var teams = d => d.team
  var grouppoints = d => d.GroupPoints
  var points = d => d.points
  var groups = d => d.group
  var season = d => d.season

  let merged = [];

  for (let i = 0; i < newdat.length; i++) {
    merged.push({
      ...newdat[i],
      // ...(pos.filter(d => d.period === selectedOption).find((d) => d.position === newdat[i].position))
    }
    );
  }
  
  var dat = merged.map(a =>
    ({
      group: a.ConstructorGroup,
      constructor: a.Constructor,
      season: a.Season,
      points: a.Points * a.Count
    }));
    
  
  //sum points per constructor per season
  dat = d3.flatRollup(dat,
    v => d3.sum(v, points),
    d => d.season,
    d => d.constructor,
    d => d.group
  )
    
  
  // flattens data to array of objects
  dat = dat.map(d => ({
    season: d[0],
    team: d[1],
    group: d[2],
    points: d[3]
    
  }));
  
  var conpoints = d3.flatRollup(dat, v => d3.sum(v, points), groups, teams).map(d => ({ group: d[0], team: d[1], points: d[2] }));
  console.log('con',conpoints);
  var groupedpoints = d3.flatRollup(data, v => d3.sum(v, points), groups, teams).map(d => ({ group: d[0], team: d[1], points: d[2] }));
  // var sortedcons = conpoints.slice().sort((a, b) => d3.descending(a.points, b.points));
  var sortedcons = conpoints.slice().sort((a, b) => d3.descending(a.points, b.points));
  groupedpoints = groupedpoints.slice().sort((a, b) => d3.descending(a.points, b.points));

  // console.log('data',data);
  // console.log('group',groupedpoints);
  // console.log(sortedcons);
  sortedcons = sortedcons.filter(d => d.points > 0);

  var seaspoints = d3.flatRollup(dat, v => d3.sum(v, points), season).map(d => ({ season: d[0], points: d[1] }));
  var maxpoints = d3.max(seaspoints.map(d => d.points));

  var cons = dat.map(d => d.team)
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
      newm[year][cons] = seasonData[j].points
    }

  }

  // console.log(newm.sort((a, b) => d3.descending(a.points, b.points)));

  // sortedcons = sortedcons.filter(d => d.group === 'Ferrari' || d.group === 'Mercedes' || d.group === 'McLaren');
  // sortedcons = conpoints.slice().sort((a, b) => d3.ascending(a.points, b.points));

  var keys = sortedcons.map(d => d.team)
  console.log(f1keys.map(d => d.team));

  var keys = f1keys.map(d => d.team)

  // let winwidth = window.innerWidth;
  let winwidth = 840;
  let winheight = 75

  var margins = 0

  var margin = { top: margins, right: margins, bottom: 0, left: margins },
    width = winwidth - margin.left - margin.right,
    height = winheight - margin.top - margin.bottom;



  var maxdom = maxpoints/2 
  // var maxdom = 1



  var xScale = d3.scaleLinear().domain(d3.extent(seasons)).range([0, width])
  var yScale = d3.scaleLinear().domain([-maxdom, maxdom]).range([height, 0])
  // var yScale = d3.scaleLinear().domain([0, maxdom]).range([height, 0])

  var stackedData = d3.stack()
    .keys(keys)
    .offset(d3.stackOffsetSilhouette)
    .order(d3.stackOrderReverse)
    (newm)
  
  console.log(stackedData);
  
  // stackOffsetSilhouette

  var area = d3.area()
    .x(d => xScale(d.data.season))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveCardinalOpen);

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
        .style("color", "black")
        .style("font-size", 17)



      // Show the areas
      svg.selectAll("mylayers")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("d", area)
        .attr("class", "myArea")
        .style("fill", d => teamcols[d.key])
        .style("stroke", 'black')
        .style("stroke-width", '0.15')
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


  }, [selectedOption])

  var cols = 7
  var gap = width / cols
  var start = 40




  return (
    <div className="App">
      <button type="button" onClick={handleDownloadImage}>
        Download as PNG
      </button>
      <header className="App-header"  >

        {loading ? <p>loading</p> :
          <div>
            {/* <div className='headline'>FORMULA 1 CONSTRUCTORS</div> */}
            {/* <h5 className='subtitle'>POINTS SYSTEM</h5>
            <div>
              <select onChange={handleSelect} value={selectedOption} className='select'>
                {[...period].map(d =>
                  <option value={d} key={d} className='option'>
                    {d}
                  </option>)}
              </select>
            </div> */}
          </div>
        }

        <div ref={printRef}>

        <svg ref={ref} width={width} height={height}>
          {/* <text fill='black' x={55} y={405} fontSize={12}>Size of stream represents number of points</text>
          <text fill='black' x={55} y={420} fontSize={12}>(2021 Points System)</text>
          <text fill='black' x={45} y={175} fontSize={12}>1950</text>
        <text fill='black' x={width + 30} y={42} fontSize={12}>2021</text> */}
        </svg>
        </div>


        <svg width={width + margin}>
          {sortedcons?.map((d, i) =>
            <g key={d.team + i}>
              <circle
                key={d.team + i}
                id={d.team.replace(/ /g, "")}
                className={d.team.replace(/ /g, "")}
                cx={margins / 2 + (i % cols) * (gap) + start}
                cy={20 + (Math.floor(i / cols)) * 20}
                r={6}
                fill={teamcols[d.team]}
                stroke={"#d3d3d3"}
                strokeWidth={0.5}
              >
              </circle>
              <text
                x={margins / 2 + (i % cols) * (gap) + (start + 20)}
                y={3 + (20 + (Math.floor(i / cols)) * 20)}
                fontSize={12}
                className={d.team.replace(/ /g, "")}
                fill={"black"}
              >
                {d.team}
              </text>

              {winwidth > 1500 ?
                <text
                  x={margins / 2 + (i % cols) * (gap) + (start+115)}
                  y={3 + (20 + (Math.floor(i / cols)) * 20)}
                  fontSize={11}
                  className={d.team.replace(/ /g, "")}
                  fill={"black"}
                >
                  {d.points.toLocaleString("en-US")}
                </text> : ""}
            </g>
          )}
        </svg>

        {/* <div className='tagline'>Created by Sports Chord</div> */}
      </header>
    </div>
  );
}

export default App;
