var width = 1080,
    height = 500,
    active = d3.select(null);
    previous = d3.select(null);

var margin = {top: 60, right: 30, bottom: 60, left: 80};

var projection = d3.geoAlbersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("#map");

var tooltip_state = d3.select("body")
	.append("div")
  .attr("class", "tooltip")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("opacity", 0.0);

var tooltip_county = d3.select("body")
	.append("div")
  .attr("class", "tooltip")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("opacity", 0.0);

// Stepped slider functionality adapted from the following: https://bl.ocks.org/shashank2104/d7051d80e43098bf9a48e9b6d3e10e73
var sliderMargin = {left: 30, right: 30},
    range = [2000, 2016],
    step = 2;

var slider = d3.select("#slider")
  .append('g')
  .classed('slider', true)
  .attr('transform', 'translate(' + (margin.left) +', '+ 10 + ')');

var xScale = d3.scaleLinear()
  .domain(range)
  .range([0, 840])
  .clamp(true);

var rangeValues = d3.range(range[0], range[1], step || 1)
  .concat(range[1]);
var xAxis = d3.axisBottom(xScale)
  .tickValues(rangeValues)
  .tickFormat(function (d) {
    return d;});

xScale.clamp(true);
// drag behavior initialization
var drag = d3.drag()
  .on('start.interrupt', function () {
    slider.interrupt();})
  .on('start drag', function () {
    dragged(d3.event.x);});

var track = slider.append('line').attr('class', 'track')
  .attr('x1', xScale.range()[0])
  .attr('x2', xScale.range()[1]);

var trackInset = d3.select(slider.node().appendChild(track.node().cloneNode()))   .attr('class', 'track-inset');

var ticks = slider.append('g').attr('class', 'ticks').attr('transform', 'translate(0, 4)')
  .call(xAxis);

// drag handle
var handle = slider.append('circle').classed('handle', true)
  .attr('r', 8);

var trackOverlay = d3.select(slider.node().appendChild(track.node().cloneNode())) .attr('class', 'track-overlay')
.call(drag);

function dragged(value) {
  var x = xScale.invert(value), index = null, midPoint, cx, xVal;
  if(step) {
    // if step has a value, compute the midpoint based on range values and reposition the slider based on the mouse position
    for (var i = 0; i < rangeValues.length - 1; i++) {
      if (x >= rangeValues[i] && x <= rangeValues[i + 1]) {
        index = i;
        break;
      }
    }
    midPoint = (rangeValues[index] + rangeValues[index + 1]) / 2;
    if (x < midPoint) {
      cx = xScale(rangeValues[index]);
      xVal = rangeValues[index];
    } else {
      cx = xScale(rangeValues[index + 1]);
      xVal = rangeValues[index + 1];
    }
  } else {
    // if step is null or 0, return the drag value as is
    cx = xScale(x);
    xVal = x.toFixed(3);
  }
  // use xVal as drag value
  handle.attr('cx', cx);
  // text.text('Value: ' + xVal);
  updateStates(xVal);
}

svg.append("rect")
    .attr("class", "background")
    .attr("fill","none")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var statePaths = svg.append("g")
    .style("stroke-width", "1.5px");

var countyPaths = svg.append("g")
    .style("stroke-width", "1.5px");

var year = '2000';

var color = d3.scaleSequential(d3.interpolateReds).domain([0.0,30.0]);

var deathRates = {};
var counties;
var states;
var genderData;
var dType = 'Assault';
var stateFilter = 'National';

d3.queue()
  .defer(d3.json, './data/Counties_by_Year_by_Cat.json')
  .defer(d3.json, './data/US_Census_Counties_20180719.json')
  .defer(d3.json, './data/death_rates_open_carry.json')
  .await(ready);

function ready(error,deaths,county_features,state_features) {
  if(error) throw error;

  deathRates = deaths;
  counties = county_features;
  states = state_features;
  // console.log(counties);

  countyPaths.selectAll("path")
    .data(counties.features)
    .enter().append("path")
    .attr("d", path)
    .attr("class", "counties")
    .on("click", reset)
    .on("mouseover", function(d){
      return tooltip_county.style("opacity",1.0).html("County: "+d.properties.NAME+"<br>Death Rate: "+parseFloat(deathRates[d.properties.County_Code][dType][year]['Death_Rate']).toFixed(2)+" per 100k");
    })
    .on("mousemove", function(){return tooltip_county.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
    .on("mouseout", function(){return tooltip_county.style("opacity", 0.0);});

  statePaths.selectAll("path")
    .data(states.features)
    .enter().append("path")
    .attr("d", path)
    .attr("name", function(d){
    return d.properties.NAME;
  })
    .attr("class", "feature")
    // .style("fill", function(d){
    // if(d.properties.Handguns == "Allowed with Restrictions"){
    //   return("rgba(218,85,38,0.2)");}
    // else if(d.properties.Handguns == "Prohibited") {
    //   return("rgba(105,127,152,0.2)");}
    // else if(d.properties.Handguns == "Permit Required") {
    //   return("rgba(254,188,56,0.2)");}
    // else{
    //   return("rgba(216,198,132,0.2)")}})
    .on("click", clicked)
    .on("mouseover", function(d){
      return tooltip_state.style("opacity",1.0).html("State: "+d.properties.NAME+"<br>Death Rate: "+parseFloat(d.properties[year]*100000).toFixed(2)+" per 100k");
    })
    .on("mousemove", function(){return tooltip_state.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
    .on("mouseout", function(){return tooltip_state.style("opacity", 0.0);});

  // console.log(deathRates);
  updateStates(year);

}

function updateStates(x) {
  year = x.toString();
  // console.log(yr);

  countyPaths.selectAll(".counties")
    .data(counties.features)
    .style("fill", function(d){
    try{
      return color(deathRates[d.properties.County_Code][dType][year]['Death_Rate']);}
    catch(error){return 0;}
  });
};

statePaths.raise();

function clicked(d) {
  if (active.node() === this) {
    stateFilter = 'National';
    // console.log(stateFilter);
    return reset();
  };
  statePaths.selectAll(".feature").style("fill","rgba(255,255,255,0.8)");

  active.classed("active", false);
  previous.style("fill","rgba(255,255,255,0.8)").style("pointer-events","auto");
  active = d3.select(this).classed("active", true).style("fill","rgba(255,255,255,0.01)").style("pointer-events","none");
  previous = active;
  stateFilter = this.getAttribute('name');
  // console.log(stateFilter);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  statePaths.transition()
      .duration(750)
      .style("stroke-width", 1.5 / scale + "px")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

  countyPaths.transition()
      .duration(750)
      .style("stroke-width", 1.5 / scale + "px")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

  statePaths.selectAll(".feature")
    .transition().duration(750);

  countyPaths.selectAll(".counties")
    .transition().duration(750)
    .style("stroke-width",1/scale+"px");

}

function reset() {
  active.classed("active", false);
  active = d3.select(null);
  previous.style("pointer-events","auto");

  statePaths.transition()
      .duration(750)
      .style("stroke-width", "1px")
      .attr("transform", "");

  countyPaths.transition()
      .duration(750)
      .attr("transform", "");

  statePaths.selectAll(".feature")
    .transition().duration(750)
    .style("fill","rgba(255,255,255,0.01)");

  countyPaths.selectAll(".counties")
      .transition().duration(750)
      .style("stroke-width", "0px");

}

d3.select('#deathType')
  .on("change", function(){
  var sect = document.getElementById("deathType");
  dType = sect.options[sect.selectedIndex].value;
  // console.log(dType);
  updateStates(year);
  });
