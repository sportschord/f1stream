import './App.css';
import * as d3 from 'd3'
import html2canvas from 'html2canvas';
import { useEffect, useRef, useState } from 'react';
import teamcols from './teamcols.json';
import grouped from './f1streamsorted.csv';
import f1keysdata from './keys.csv';

function App() {

  const [data, setData] = useState([]);
  const [f1keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef();
  const printRef = useRef();
  const [reactWidth, setReactWidth] = useState(1100);
  const [reactHeight, setReactHeight] = useState(185);
  const [heightCounter, setHeightCounter] = useState(reactHeight);
  const [widthCounter, setWidthCounter] = useState(reactWidth);

  const handleDownloadImage = async () => {
    const element = printRef.current;
    const canvas = await html2canvas(element, { scale: 30 });

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
      d3.csv(grouped),
      d3.csv(f1keysdata),

    ]).then((d) => {
      return (
        setData(d[0]),
        setKeys(d[1])
      )
    }).then(() =>
      setLoading(false)
    )
  }, []);

  //accessor functions
  var season = d => d.season;

  var seasons = Array.from(new Set(data.map(season)));
  var keys = f1keys.map(d => d.team)

  // let winwidth = window.innerWidth;
  let winwidth = reactWidth;
  let winheight = reactHeight

  var margins = 0

  var margin = { top: margins, right: margins, bottom: margins, left: margins },
    width = winwidth - margin.left - margin.right,
    height = winheight - margin.top - margin.bottom;

  var maxdom = 2400 / 2
  // var maxdom = 1

  console.log(data);

  var xScale = d3.scaleLinear()
    .domain(d3.extent(seasons))
    .range([0, width])

  var yScale = d3.scaleLinear().domain([-maxdom, maxdom]).range([height, 0])

  var stackedData = d3.stack()
    .keys(keys)
    .offset(d3.stackOffsetSilhouette)
    .order(d3.stackOrderReverse)
    (data)

  // stackOffsetSilhouette

  var area = d3.area()
    .x(d => xScale(d.data.season))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveCardinalOpen);

  useEffect(() => {

    if (data) {


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


        d3.selectAll("text." + d.target.id)
          .style("opacity", 1)
        d3.select("circle." + d.target.id)
          .style("opacity", 1)
        d3.select("#" + d.target.id)
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
        d3.select("#" + d.target.id)
          .style("stroke", "grey")
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
        .style("stroke", 'grey')
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
      // .ease(d3.easeBounce)
      // .delay(1000)
      .duration(1000)
      .attr("d", area)
      .style("fill", d => teamcols[d.key])


  }, [reactHeight, reactWidth])

  var cols = 8
  var gap = width / cols
  var start = 40

  var handleClick = () => {
    setReactHeight(heightCounter)
    setReactWidth(widthCounter)
  }


  return (
    <div className="App">
      <button type="button" onClick={handleDownloadImage}>
        Download as PNG
      </button>
      <header className="App-header"  >

        {
          loading ? <p>loading</p> :

            <div className='optionsbox'>
              <text style={{ fontSize: '20px', fontWeight: 'Bold', verticalAlign: 'Top' }}>Size Options</text>
              <div className='options'>
                <text>Height</text>
                <div className='slider'>
                  <input
                    type="range"
                    id="quantity"
                    value={heightCounter}
                    step="5"
                    min="100"
                    max="200"
                    onChange={(e) => setHeightCounter(e.target.value)}
                  />

                  <text>{heightCounter}</text>

                </div>

              </div>
              <div className='options'>
                <text>Width</text>
                <div className='slider'>
                  <input
                    type="range"
                    id="quantity"
                    value={widthCounter}
                    min="1000"
                    max="1500"
                    step="10"
                    onChange={(e) => setWidthCounter(e.target.value)}
                  />
                  <text>{widthCounter}</text>

                </div>

              </div>
              <button onClick={handleClick}>Edit Size</button>
            </div>
        }

        <div ref={printRef}>
          <svg ref={ref} width={width} height={height}>
          </svg>
        </div>

        {loading ? <p>loading</p> :


          <svg width={width + margin}>
            {keys?.map((d, i) =>
              <g key={d + i}>
                <circle
                  key={d + i}
                  id={d.replace(/ /g, "")}
                  className={d.replace(/ /g, "")}
                  cx={margins / 2 + (i % cols) * (gap) + start}
                  cy={20 + (Math.floor(i / cols)) * 20}
                  r={6}
                  fill={teamcols[d]}
                  stroke={"#d3d3d3"}
                  strokeWidth={0.5}
                >
                </circle>
                <text
                  x={margins / 2 + (i % cols) * (gap) + (start + 20)}
                  y={3 + (20 + (Math.floor(i / cols)) * 20)}
                  fontSize={12}
                  className={d.replace(/ /g, "")}
                  fill={"black"}
                >
                  {d}
                </text>

                {winwidth > 1500 ?
                  <text
                    x={margins / 2 + (i % cols) * (gap) + (start + 115)}
                    y={3 + (20 + (Math.floor(i / cols)) * 20)}
                    fontSize={11}
                    className={d.replace(/ /g, "")}
                    fill={"black"}
                  >
                    {d.points.toLocaleString("en-US")}
                  </text> : ""}
              </g>
            )}
          </svg>
        }
      </header>
    </div>
  );
}

export default App;
