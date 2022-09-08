
// Get the width of the bar container
const width = document.getElementById("bar").offsetWidth;

// Somewhat arbitrary choices...
// The 0.016 width ensures that the right side of the histogram and table are flush
// The top container takes up 100vw broken into 45 + 13 + 2 + 40. That last one is the table-container.
// Since the table only uses 96% of space available, we have 100 - 60 + 40(0.96) = 1.6vw of space as buffer
const height = 200;
const margin = { top: 20, right: 0.016*width, bottom: 20, left: 80 };
const xAxisLabelOffset = 50;
const yAxisLabelOffset = 45;

// Given the margins above, calculate how much room we actually have to work with
const innerHeight = height - margin.top - margin.bottom;
const innerWidth = width - margin.left - margin.right;

// Define a brush, we want the scope outside of the d3.csv callback
const brush = d3.brushX()

// Consider this the default csv
d3.csv("https://raw.githubusercontent.com/JayGupta797/ninja/main/bars/Child_Abuse_bar.csv", function(error, data) {

  // Check if the data loaded correctly
  // console.log(data[0])

  // Parse the date strings into javascript dates
  data.forEach(function(d) {
    d.created_date = d3.isoParse(d.date);
  });

  // Check dates
  // console.log(data[0].date)

  // Define accessors for convenience...
  // Maybe make some labels while we're at it
  const xValue = d => d.created_date;
  const xAxisLabel = 'Time'; // This was left un-used in the final draft

  const yValue = d => d.value;
  const yAxisLabel = 'Bills Introduced';

  // Make the timing to year-wise, see https://d3-wiki.readthedocs.io/zh_CN/master/Time-Formatting/
  const xAxisTickFormat = d3.timeFormat('%Y');
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, xValue))
    .range([0, innerWidth])
    .nice();

  // Check scales
  // console.log(xScale)
  // console.log(yScale)

  // Determine the first and last dates in the data set
  var monthExtent = d3.extent(data, function(d) { return d.created_date; });

  // Check extent
  // console.log(monthExtent)
  // console.log(d3.timeMonth.offset(monthExtent[0],-1))

  // Create one bin per month, use an offset to include the first and last months
  var monthBins = d3.timeMonths(d3.timeMonth.offset(monthExtent[0],-1),
                                d3.timeMonth.offset(monthExtent[1],1));

  // Use the histogram layout to create a function that will bin the data
  var binByMonth = d3.histogram()
    .value(xValue)
    .domain(xScale.domain())
    .thresholds(monthBins);

  // Bin the data by month, sum for frequency
  var histData = binByMonth(data)
    .map(array => ({
      y: d3.sum(array, yValue),
      x0: array.x0,
      x1: array.x1
    }));

  // Milestone
  // console.log(histData)

  // Remember that we added a new property 'y' while making histData
  // This is the ySum...
  const ySum = d => d.y;
  const yScale = d3.scaleLinear()
    .domain(d3.extent(histData, ySum))
    .range([innerHeight, 0]);

  // Define xAxis, scale and tick accordingly
  var xAxis = d3.axisBottom()
    .scale(xScale)
    .tickFormat(xAxisTickFormat);

  // Create the actual svg inside the bar-box class, position accordingly
  var svg = d3.select("div .bar-box").append("svg")
  .attr("width", width) // + margin.left + margin.right
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Add bars, note that we use d.y instead of d.length b/c it was re-mapped above
  svg.selectAll(".bar")
    .data(histData)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return xScale(d.x0); })
      .attr("width", function(d) { return xScale(d.x1) - xScale(d.x0) })
      .attr("y", function(d) { return yScale(d.y); })
      .attr("height", function(d) { return innerHeight - yScale(d.y); });

  // Add the X Axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + innerHeight + ")")
      .call(xAxis);

  // Add the Y Axis and label
  var yAxis = svg.append("g")
     .attr("class", "y axis")
     .call(d3.axisLeft().scale(yScale).ticks(5))
  
  svg.append("text")
      .attr("transform", "translate(-60, 0) rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(yAxisLabel)
      .style("font-family", "Noto Sans");

    // For future reference...
    // const brush = d3.brushX()
    // .extent([ [0, 0], [innerWidth, innerHeight] ]);
    // .on('start brush', function () {
    //         var selection = d3.event.selection
    //         // console.log(selection)
    //         // var x0 = xScale.invert(selection[0])
    //         // var x1 = xScale.invert(selection[1])
    //         // console.log(x0)
    //         // console.log(x1)
    // })

  // Make the brush go from the start to end
  brush.extent([ [0, 0], [innerWidth, innerHeight] ]);

  // Add the brush
  svg.append('g')
    .attr('class', 'brush')
    .attr('id', 'brush')
    .call(brush)
    .call(brush.move, [0, innerWidth]);

  // A function that creates / updates the plot for a given variable
  function update(newData) {

    // Parse the date strings into javascript dates
    newData.forEach(function(d) {
      d.created_date = d3.isoParse(d.date);
    });

    // Bin the data
    var newHistData = binByMonth(newData)
      .map(array => ({
        y: d3.sum(array, yValue),
        x0: array.x0,
        x1: array.x1
      }));

    // Re-scale the yAxis, animate this!
    yScale.domain(d3.extent(newHistData, ySum));
    yAxis.transition().duration(1000).call(d3.axisLeft(yScale).ticks(5));

    // Re-make the histogram too!
    var u = svg.selectAll(".bar")
               .data(newHistData)

    u
      .enter()
      .append("rect")
      .merge(u)
      .transition()
      .duration(1000)
        .attr("x", function(d) { return xScale(d.x0); })
        .attr("width", function(d) { return xScale(d.x1) - xScale(d.x0) })
        .attr("y", function(d) { return yScale(d.y); })
        .attr("height", function(d) { return innerHeight - yScale(d.y); });
        // .attr("fill", "#69b3a2");
  }

  // Change the data-set when the selector is clicked
  d3.select("select").on("input", function() {

    topic = d3.select('select').property('value')
    
    // Figure out which link to go to
    if (topic == 'Sexual Violence') { var bardata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/bars/Sexual_Violence_bar.csv"; } 
    else if (topic == 'Federal Funding') { var bardata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/bars/Federal_Funding_bar.csv"; } 
    else if (topic == "DOD") { var bardata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/bars/DOD_bar.csv"; } 
    else if (topic == 'Public Insurance') { var bardata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/bars/Public_Insurance_bar.csv"; } 
    else if (topic == 'Children') { var bardata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/bars/Child_Abuse_bar.csv"; } 
    else if (topic == 'Veterans Affairs') { var bardata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/bars/VHA_bar.csv"; } 
    else if (topic == 'Juvenile Justice') { var bardata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/bars/Juvenile_Justice_bar.csv"; } 
    else { var bardata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/bars/School_Education_bar.csv"; }

    d3.csv(bardata, function(error, data) {
      update(data)
    });

  });

});

