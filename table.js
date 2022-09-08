
// Options for selector
var data = ["Children", "Federal Funding", "DOD", "Public Insurance", "Sexual Violence", "Veterans Affairs", "Juvenile Justice", "School"];

// Create selector, call update() on click
var select = d3.select('div .selector-box')
.append('select')
.attr('class','select')
.on('change', update)

// Add options
var options = select
.selectAll('option')
.data(data).enter()
.append('option')
.text(function (d) { return d; });

// Create table
var columns = ["id", "title", 'url', 'date'];
var table = d3.select("div .table-box").append("table").attr("id", "bills");
var thead = table.append("thead");
var tbody = table.append("tbody");

// Keep everything left aligned
thead.style('text-align', 'left');

// Add table data
thead.append("tr")
  .selectAll("th")
  .data(columns)
  .enter()
  .append("th")
  .text(function(column) { return column; });

// Call update with current selection choice
update()

// For future reference...
// tbody.selectAll("tr")
//   .data(table_data)
//   .enter()
//   .append("tr")
//   .selectAll("td")
//   .data(function(row) {
//       return columns.map(function(column) {
//       return {
//         column: column,
//         value: row[column]
//       };
//     });
//   })
//   .enter()
//   .append("td")
//   .text(function(d) { return d.value; });

// Update table when selector is clicked
function update() {

  // Get the topic selected
	topic = d3.select('select').property('value')

  // Figure out which link to go to
	if (topic == 'Sexual Violence') { var tabledata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/tables/Sexual_Violence_table.json"; } 
  else if (topic == 'Federal Funding') { var tabledata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/tables/Federal_Funding_table.json"; } 
  else if (topic == "DOD") { var tabledata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/tables/DOD_table.json"; } 
  else if (topic == 'Public Insurance') { var tabledata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/tables/Public_Insurance_table.json"; } 
  else if (topic == 'Children') { var tabledata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/tables/Child_Abuse_table.json"; } 
  else if (topic == 'Veterans Affairs') { var tabledata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/tables/VHA_table.json"; } 
  else if (topic == 'Juvenile Justice') { var tabledata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/tables/Juvenile_Justice_table.json"; } 
  else { var tabledata = "https://raw.githubusercontent.com/JayGupta797/ninja/main/tables/School_Education_table.json"; }

  // Re-make the table!
  d3.json(tabledata, function(error, data) {
    tbody.selectAll("tr").remove()
    tbody.selectAll("tr")
    .data(data)
    .enter()
    .append("tr")
    .selectAll("td")
    .data(function(row) {
        return columns.map(function(column) {
        return {
        column: column,
        value: row[column]
        };
      });
    })
    .enter()
    .append("td")
    .text(function(d) {return d.value;})
  });

}
