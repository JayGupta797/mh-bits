
// Wait to load geo and map data. It's a large file even after compression...
d3.queue()
    .defer(d3.csv, 'https://raw.githubusercontent.com/JayGupta797/ninja/main/maps/Child_Abuse_map.csv', function (d) {
      
      // parse dates, make values numbers and rename d.geoid for consistency
        return {
            GEOID: d.geoid, 
            date: d3.isoParse(d.date),
            value: +d.value
        }
    })
    .defer(d3.json, 'https://raw.githubusercontent.com/JayGupta797/ninja/main/district.json')
    .awaitAll(initialize)

// Once the map data is ready-to-go, start adding things to the dom
function initialize(error, results) {
    if (error) { throw error }

    // Quick Check
    // console.log(results[0])
    // console.log(results[1].features)

    // Get results and re-name accordingly
    var data = results[0]
    var features = results[1].features

    // The width and height of our map. We can make this adaptive later?
    var width = 480
    var height = 300

    // Choose Projection
    var projection = d3.geoAlbersUsa()
        .scale([width * 1.25])
        .translate([width / 2, height / 2])

    var path = d3.geoPath().projection(projection)

    // Add the svg
    var svg = d3.select('div .map-box')
        .append('svg')
        .attr('width', width)
        .attr('height', height)

    // Add the map
    svg.selectAll('path')
        .data(features)
        .enter()
        .append('path')
        .attr('d', path)
        .style('stroke', '#000')
        .style('stroke-width', 0.25)

    // since the user can choose ANY segmentation of time, this is an aggregation problem
    // refer -- https://stackoverflow.com/questions/30025965/merge-duplicate-objects-in-array-of-objects
    // the start and end dates don't change so d3.isoParse('2009-1-1'), d3.isoParse('2021-1-1') works well
    function mapfilter(data, start=d3.isoParse('2009-1-1'), stop=d3.isoParse('2021-1-1')) {

      var agg = JSON.parse(JSON.stringify(data));
      var seen = {};

      agg = agg.filter(function(entry) {
        var previous;
        entry.date = d3.isoParse(entry.date); // the dates get 'un-parsed' upon stringify

        if (entry.date < start || entry.date > stop) {
          return false;
        }

        // Have we seen this label before?
        if (seen.hasOwnProperty(entry.GEOID)) {

            // Yes, grab it and add this data to it
            previous = seen[entry.GEOID];
            previous.value = previous.value + entry.value;

            // Don't keep this entry, we've merged it into the previous one
            return false;
        }

        // Remember that we've seen it
        // we need to assign entry b/c it is a pointer to the first occurence!
        seen[entry.GEOID] = entry;

        // Keep this one, we'll merge any others that match into it
        return true;
      });

      // Some checking
      // console.log(agg);
      return agg;
    }

    // get the default agg_data from start to finish
    agg_data = mapfilter(data)

    // get the maximum number of sponsorships
    // this will be usefule for creating the scale and color thresholds in just a bit
    var max = d3.max(agg_data, function(d) { return d.value; });

    // define the color function -- value -> color
    var color = d3.scaleThreshold()
      .domain([0.125*max, 0.25*max, 0.375*max, 0.5*max, 0.625*max, 0.75*max, 0.875*max])
      .range(['#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'])

    // Update the map given filtered data, this will be called a little bit later
    function update(fdata) {
        svg.selectAll('path')
           .style('fill', '#ddd' )
           .data(fdata)
           .style('fill', function (d) { return color(d.value) })
    }

    // Add the data and color the polygons
    svg.selectAll('path')
        .data(agg_data)
        .style('fill', function (d) { return color(d.value) })

    // Create the legend
    var legendColors = ["#081d58", "#253494", "#225ea8", "#1d91c0", "#41b6c4", "#7fcdbb", "#c7e9b4", "#edf8b1"];

    var legend = d3.select("div .map-box")
      .append("svg")
      .attr("width", 75)
      .attr("height", 300)
      .attr("id", "legend");

    // Add the rectangles
    var legenditem = legend.selectAll(".legenditem")
      .data(d3.range(8))
      .enter()
      .append("g")
        .attr("class", "legenditem")
        .attr("transform", function(d, i) { return "translate(25," + i * 30 + ")"; });

    // Notice how i * 30 has to pair with height = 30 
    legenditem.append("rect")
      .attr("x", 0)
      .attr("y", 25)
      .attr("width", 30)
      .attr("height", 30)
      .attr("class", "rect")
      // .style("stroke", "black")
      // .style("stroke-width", "1")
      .style("fill", function(d, i) { return legendColors[i]; });

    // Initialize the y-axis
    var y = d3.scaleLinear()
              .domain([0, max])
              .range([240, 0]);

    var yAxis = legend.append("g")
      .attr("transform", "translate(25,25)")
      .attr("class", "myYaxis")
      .call(d3.axisLeft().scale(y).ticks(10));

    // The .foo business is to register another event listener
    // See: https://stackoverflow.com/questions/14749182/how-to-register-multiple-external-listeners-to-the-same-selection-in-d3
    d3.select("select").on("input.foo", function() {

      // self notes...
      // get new data and re-assign
      // calculate quartiles
      // change y.domain and update yAxis
      // change color.domain threshold values
      // update 

      // get the topic and find correct data-set
      topic = d3.select('select').property('value')
      
      // Figure out which link to go to
      if (topic == 'Sexual Violence') { var mapdata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/maps/Sexual_Violence_map.csv"; } 
      else if (topic == 'Federal Funding') { var mapdata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/maps/Federal_Funding_map.csv"; } 
      else if (topic == "DOD") { var mapdata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/maps/DOD_map.csv"; } 
      else if (topic == 'Public Insurance') { var mapdata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/maps/Public_Insurance_map.csv"; } 
      else if (topic == 'Children') { var mapdata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/maps/Child_Abuse_map.csv"; } 
      else if (topic == 'Veterans Affairs') { var mapdata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/maps/VHA_map.csv"; } 
      else if (topic == 'Juvenile Justice') { var mapdata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/maps/Juvenile_Justice_map.csv"; } 
      else { var mapdata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/maps/School_Education_map.csv"; }

      // read the data
      d3.csv(mapdata, function(error, newdata) {

        // re-assign data, ignore any existing x0, x1 bounds
        newdata.forEach(function(d) {
          d.GEOID =  d.geoid;
          d.date = d3.isoParse(d.date);
          d.value = +d.value;
        });
        new_agg_data = mapfilter(newdata)

        data = newdata
        agg_data = new_agg_data

        // adjust the color-scale
        max = d3.max(agg_data, function(d) { return d.value; });
        color.domain([0.125*max, 0.25*max, 0.375*max, 0.5*max, 0.625*max, 0.75*max, 0.875*max])
        y.domain([0, max]);
        yAxis.transition().duration(1000).call(d3.axisLeft(y));

        // update the map
        update(agg_data)

      });

    });

    // get the xScale used in bar.js so the xScale.invert business works
    // maybe I could have made xScale global in scope to begin with but whatever
    const xScale = d3.scaleTime() // doesn't really change...
        .domain([d3.isoParse('2009-1-1'), d3.isoParse('2021-1-1')])
        .range([0, innerWidth])
        .nice();

    // when the user updates the brush
    brush.on('brush', function () {

      // get the selection and dates
      var selection = d3.event.selection;
      var x0 = xScale.invert(selection[0]);
      var x1 = xScale.invert(selection[1]);

      // get the filtered data between those bounds
      fdata = mapfilter(data, x0, x1)

      // update the map
      update(fdata)

      // Some checking
      // console.log(fdata);
      // console.log(fdata.length);

    });

}
