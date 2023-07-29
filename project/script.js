// to get the drop down menu on the screen 
const counties = ["SUFFOLK", "NASSAU", "WESTCHESTER"];

let dropDown = d3.select("#county-selection")
                .append("select")
                .attr("name", "county-list")
                .attr("class", "drop-down");
                
let options = dropDown.selectAll("option")
                    .data(counties)
                    .enter()
                    .append("option");

options.text(d => d)
    .attr("value", d => d);

let selectedCounty = "SUFFOLK"; // Initialize with an empty value

let preproc = function(filePath){
    //preprocess data 
    d3.csv(filePath).then(function(data){
        // the data is now with all the correct types
        console.log(data) 
        data.forEach(d => {
            d["Audio Collection"] = +d["Audio Collection"];
            d["County Population"] = +d["County Population"];
            d["Digital Collection"] = +d["Digital Collection"];
            d["Downloadable Audio"] = +d["Downloadable Audio"];
            d["Employees_Hours"] = +d["Employees_Hours"];
            d["Employees_NC"] = +d["Employees_NC"];
            d["Latitude"] = +d["Latitude"];
            d["Librarians"] = +d["Librarians"];
            d["Library Visits"] = +d["Library Visits"];
            d["Longitude"] = +d["Longitude"];
            d["Physical Video"] = +d["Physical Video"];
            d["Print Collection"] = +d["Print Collection"];
            d["Registered Users"] = +d["Registered Users"];
            d["Service Population"] = +d["Service Population"];
            d["Service Population Without Duplicates"] = +d["Service Population Without Duplicates"];
            d["Total Staff"] = +d["Total Staff"];
        });

        countyInfo()
        barchart(data); // need to go back and add a tool tip so that when it overs, it shows service population + number of collection 
        scatterplot(data); 
        networkDiagram();
        mapChart(); 
        change(data);
    });
};

let xScaleBar = "";
let yScaleBar = ""; 
let xAxisBar = ""; 
let yAxisBar = ""; 
let stack = ""; 
let groups = ""; 
let rect = "";
let stackedData = "";
let libraries = "";
let dataCounty = "";
let colorScale = "";
let collections = "";
let tooltipBar = "";

let xScaleScatter = "";
let yScaleScatter = ""; 
let xAxisScatter = ""; 
let yAxisScatter = ""; 
let tooltipScatter = "";

let tooltipNetwork = ""; 
let tooltipMap = ""; 
let groupData = "";

let points = "";
let projection = "";

let svgwidth = 1000;
let svgheight = 1000;

let countyPop = 0; 
let suffolkPop = 1502968;
let nassauPop = 1358627; 
let westchesterPop = 972634; 

// display county population and selected county 
let countyInfo = function (){
    if (selectedCounty == "SUFFOLK"){
        countyPop = suffolkPop;
    }
    else if (selectedCounty == "NASSAU"){
        countyPop = nassauPop; 
    }
    else{
        countyPop = westchesterPop; 
    }
    
    d3.select("#county-info").append("p").attr("class", "info").text(selectedCounty + "'s Population as of 2014: " + countyPop)

}


// NEED TO COMEBACK AND FIX - THE Y-SCALE ISN'T WORKING CORRECTLY ON UPDATING (ONLY FOR ORIGINAL VAUE)
let barchart = function(data){
    const margin = {
        top: 100,
        bottom: 250,
        left: 150,
        right: 100,
    };
    
    dataCounty = data.filter(function(d) {
        return d.County == selectedCounty;
    });

    collections = ["Print Collection", "Digital Collection", "Audio Collection", "Downloadable Audio", "Physical Video"];
    dataCounty.sort((a, b) => (a["Library Name"] > b["Library Name"]) ? 1 : -1);

    libraries = [];
    for (i in dataCounty) {
        lib = dataCounty[i]["Library Name"];
        libraries.push(lib);
    }

    xScaleBar = d3.scaleBand().domain(libraries).range([margin.left, svgwidth - margin.right]);

    yScaleBar = d3.scaleLinear().domain([
        0,
        d3.max(dataCounty, d => d["Print Collection"] + d["Digital Collection"] + d["Audio Collection"] + d["Downloadable Audio"] + d["Physical Video"])
    ])
    .range([svgheight - margin.bottom, margin.top]); // yScale range
    xAxisBar = d3.axisBottom().scale(xScaleBar);
    yAxisBar = d3.axisLeft().scale(yScaleBar);
    
    let svg = d3.select("#bar-chart-svg")
    
    // adding X axis
    svg.append("g")
        .call(xAxisBar)
        .attr("class", "xAxis")
        .attr("transform", `translate(0, ${svgheight - margin.bottom})`)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)");
    
    // adding Y axis
    svg.append("g")
        .attr("class", "yAxis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxisBar);

    stack = d3.stack().keys(collections);
    stackedData = stack(dataCounty);
    colorScale = d3.scaleOrdinal()
        .domain(collections)
        .range(['#05668D', '#5E5E5F', '#B87ED3', '#679436', "#E25B5B"]);
    
    groups = svg.selectAll("g.bars")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "bars")
        .style("fill", function(d) {
            return colorScale(d.key);
        })
        .style("stroke", "#000");
    
    rect = groups.selectAll("rect")
        .data(function(d) {
            return d;
        })
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return xScaleBar(d.data["Library Name"]);
        })
        .attr("y", function(d) {
            return yScaleBar(d[1]);
        })
        .attr("height", function(d) {
            return yScaleBar(d[0]) - yScaleBar(d[1]); // Adjusted height calculation
        })
        .attr("width", xScaleBar.bandwidth())
        .attr("stroke", "none")
        .attr("class", "rects");
    tooltipBar = d3.select("#bar-chart-1").append("tooltip").attr("class", "tooltip");
    updateBarTooltip(); 
    
    // ADDING IN ALL THE LABELS AND TEXT 
    // Legend items 
    
    // print collection label 
    svg.append("circle")
        .attr("cx", svgwidth - margin.right - 70)
        .attr("cy", 100)
        .attr("r", 8)
        .attr("fill", "#05668D");

    svg.append("text")
        .attr("x", svgwidth - margin.right-60)
        .attr("y", 105)
        .text("Print Collection")
        .style("font-size", "15px");

    // Digital Collection Label 
    svg.append("circle")
    .attr("cx", svgwidth - margin.right - 70)
    .attr("cy", 120)
    .attr("r", 8)
    .attr("fill", "#5E5E5F");

    svg.append("text")
        .attr("x", svgwidth - margin.right - 60)
        .attr("y", 125)
        .text("Digital Collection")
        .style("font-size", "15px");

    // Audio Collection Label 
    svg.append("circle")
        .attr("cx", svgwidth - margin.right - 70)
        .attr("cy", 140)
        .attr("r", 8)
        .attr("fill", "#b87ed3");
    
    svg.append("text")
        .attr("x", svgwidth - margin.right - 60)
        .attr("y", 145)
        .text("Audio Collection")
        .style("font-size", "15px");
    
    // Downloadable Audio Label 
    svg.append("circle")
        .attr("cx", svgwidth - margin.right - 70)
        .attr("cy", 160)
        .attr("r", 8)
        .attr("fill", "#679436");

    svg.append("text")
        .attr("x", svgwidth - margin.right - 60)
        .attr("y", 165)
        .text("Downloadable Audio")
        .style("font-size", "15px");
    
    // Physical Video Label
    svg.append("circle")
        .attr("cx", svgwidth - margin.right - 70)
        .attr("cy", 180)
        .attr("r", 8)
        .attr("fill", "#E25B5B");

    svg.append("text")
        .attr("x", svgwidth - margin.right - 60)
        .attr("y", 185)
        .text("Physical Video")
        .style("font-size", "15px");

    // Title
    svg.append("text")
        .attr("x", margin.left/2)
        .attr("y", margin.top - 40)
        .text("Audio Collections Lacking in Libraries")
        .style("font-size", "25px");
    
    // x axis
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", svgwidth/2 + 50)
        .attr("y", svgheight - margin.bottom/6)
        .attr("font-size", "20px")
        .text("Library Name");
    
    // Y axis
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("x",-320)
        .attr("y", 50)
        .text("Number in Collection")
        .attr("font-size", "20px");
};

// this is working correctly
let updateBarTooltip = function (){
    rect.on("mouseover", function(e, d) {
        d3.selectAll(".rects").style("opacity", 0.5)
        d3.select(this)
            .style("cursor", "none")
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", "3px");
        tooltipBar
            .style("opacity", 1)
            .style("position", "absolute")
            .style("border", "solid")
            .style("border-width", "5px")
            .style("background-color", "white")
            .style("left", (e.pageX+10) + "px")
            .style("top", (e.pageY-10)+"px")
            .text("# in this collection: " + (d[1]-d[0]))
            .style("font-size", "15px") 
    })
    .on("mouseout", function() {
        d3.selectAll(".rects").style("opacity", 1)
        d3.select(this).style("cursor", "default").style("stroke", null);
        tooltipBar.style("opacity", 0); // this is just making it disappear
    });
};

let scatterplot = function(data){
    const margin = {
        top: 150,
        bottom: 150,
        left: 150,
        right: 100,
    };

    dataCounty = data.filter(function(d) {
        return d.County == selectedCounty;
    });

    xScaleScatter = d3.scaleLinear().domain([0, d3.max(dataCounty, d => d["Library Visits"])]).range([margin.left, svgwidth - margin.right]);
    yScaleScatter = d3.scaleLinear().domain([0, d3.max(dataCounty, d => d["Registered Users"])]).range([svgheight - margin.bottom, margin.top]);

    xAxisScatter = d3.axisBottom().scale(xScaleScatter);
    yAxisScatter = d3.axisLeft().scale(yScaleScatter);

    let svg = d3.select("#scatterplot-svg")
    
    // adding X axis
    svg.append("g")
        .call(xAxisScatter)
        .attr("class", "xAxis")
        .attr("transform", `translate(0, ${svgheight - margin.bottom})`);
    
    // adding Y axis
    svg.append("g")
        .call(yAxisScatter)
        .attr("class", "yAxis")
        .attr("transform", `translate(${margin.left}, 0)`);
    
    tooltipScatter = d3.select("#scatterplot").append("tooltip").attr("class", "tooltip");

    svg.selectAll(".circles")
        .data(dataCounty)
        .enter()
        .append("circle")
        .attr("class", "circles")
        .attr("cx", d => xScaleScatter(d["Library Visits"]))
        .attr("cy", d => yScaleScatter(d["Registered Users"]))
        .attr("r", 7)
        .attr("fill", "#05668d")
        .on("mouseover", handleMouseoverScatter)
        .on("mouseout", handleMouseoutScatter);


    // Title
    svg.append("text")
        .attr("x", margin.left/2)
        .attr("y", margin.top - 40)
        .text("Registered Users Greatly Impact by Library Visits")
        .style("font-size", "25px");
    
    // x axis
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", svgwidth/2 + 150)
        .attr("y", svgheight - margin.bottom/2)
        .attr("font-size", "20px")
        .text("Number of Library Visits");
    
    // Y axis
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("x",-350)
        .attr("y", 50)
        .text("Number of Registered Users")
        .attr("font-size", "20px");

};
function handleMouseoverScatter(e, d) {
    console.log(d)
    d3.select(this)
        .transition()
        .duration(500)
        .ease(d3.easeBounce)
        .attr("fill", "#F7C548")
        .attr("r", "15")
        .attr("stroke", "black")
        .attr("stroke-width", "3px");

  tooltipScatter
        .style("opacity", 1)
        .style("position", "absolute")
        .style("border", "solid")
        .style("border-width", "5px")
        .style("background-color", "white")
        .style("left", (e.pageX+20) + "px")
        .style("top", (e.pageY-10)+"px")
        .text("Library Name:" + d["Library Name"] + "\n | \n" + "Library Visits:" + d["Library Visits"] + "\n | \n"  + 
        "Registered Users:" + d["Registered Users"] +  "\n | \n" +  
        "Service Population:" + d["Service Population"])
        .style("font-size", "20px") 
}
  
  function handleMouseoutScatter(e, d) {
    d3.select(this)
        .attr("fill", "#05668d")
        .attr("r", "7")
        .attr("stroke", null);

    tooltipScatter.style("opacity", 0);
  }

let networkDiagram = function(data){
    const svg = d3.select("#network-svg");
    tooltipNetwork = d3.select("#node-links").append("tooltip").attr("class", "tooltip");

    d3.json("data/links.json").then(function (data) {
        let dataUse= data[selectedCounty]
        
        // Extract nodes and links from the data
        const nodes = dataUse.nodes;
        const links = dataUse.links;

        groupData = svg.append("g").attr("class", "everything")

        let link = groupData.selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke", "grey")
            .style("stroke-width", 1)
            .attr("class", "item")
            .on("mouseover", handleMouseoverNetworkLink)
            .on("mouseout", handleMouseoutNetworkLink); 
        
        const nodeElements = groupData
        .selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node");
    
        nodeElements
            .append("circle")
            .attr("fill", "#05668d")
            .attr("r", (d) => 10)
            .on("mouseover", handleMouseoverNetworkNode)
            .on("mouseout", handleMouseoutNetworkNode);

        const simulation = d3
            .forceSimulation(nodes)
            // .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(1000/2, 1000/2))
            .force("x", d3.forceX(1000/2))
            .force("y", d3.forceY(1000/2))
            .force("link", d3.forceLink(links).id(d => d.id).distance(700));

        simulation.on("tick", () => {
            // Update node  positions.
            // nodeElements.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
            nodeElements.attr("transform", d => `translate(${d.x},${d.y})`);
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            }) ;
        let zoom = d3.zoom()
            .scaleExtent([1, 4])
            .translateExtent([[0,0], [svgwidth, svgheight]])
            .on("zoom", function(e) {
                groupData.attr("transform", e.transform); 
            })  
            groupData.call(zoom);   
    });
};

function handleMouseoverNetworkNode(e, d) {
    console.log(d)
    d3.select(this)
        // .transition()
        .attr("stroke", "black")
        .attr("fill", "#F7C548")
        .attr("stroke-width", "3px");
    // change it so when hover over the node, it tell service populations, library name is correct 
    tooltipNetwork
        .style("opacity", 1)
        .style("position", "absolute")
        .style("border", "solid")
        .style("border-width", "5px")
        .style("background-color", "white")
        .style("left", (e.pageX+20) + "px")
        .style("top", (e.pageY-10)+"px")
        .text("Library Name: " + d["name"])
        .style("font-size", "20px")
  }

  function handleMouseoutNetworkNode(e, d) {
    d3.select(this)
        .attr("fill", "#05668d")
        .attr("r", "10")
        .attr("stroke", null);
    tooltipNetwork.style("opacity", 0);
  }

  function handleMouseoverNetworkLink(e, d) {
    d3.select(this).style("stroke", "#F7C548").style("stroke-width", "4px");
  }

  function handleMouseoutNetworkLink(e, d) {
    d3.select(this).style("stroke", "grey").style("stroke-width", "1px");
  }


let mapChart = function() {
    const svg = d3.select("#geoGraph-svg");
    projection = d3.geoAlbers().translate([-7*svgwidth, 2.5*svgheight]).scale(25000);
    const geoGenerator = d3.geoPath().projection(projection);
    const margin = {
        top: 100,
        bottom: 250,
        left: 150,
        right: 100,
    };

    // Suffolk Label 
    svg.append("circle")
        .attr("cx", svgwidth - margin.right - 70)
        .attr("cy", 140)
        .attr("r", 8)
        .attr("fill", "#255957");
    
    svg.append("text")
        .attr("x", svgwidth - margin.right - 60)
        .attr("y", 145)
        .text("Suffolk")
        .style("font-size", "15px");
    
    // Nassau 
    svg.append("circle")
        .attr("cx", svgwidth - margin.right - 70)
        .attr("cy", 160)
        .attr("r", 8)
        .attr("fill", "#A98743");

    svg.append("text")
        .attr("x", svgwidth - margin.right - 60)
        .attr("y", 165)
        .text("Nassau")
        .style("font-size", "15px");
    
    // Westchester
    svg.append("circle")
        .attr("cx", svgwidth - margin.right - 70)
        .attr("cy", 180)
        .attr("r", 8)
        .attr("fill", "#F7C548");

    svg.append("text")
        .attr("x", svgwidth - margin.right - 60)
        .attr("y", 185)
        .text("Westchester")
        .style("font-size", "15px");


  
    function drawMap(geojson) {
        let newYork = svg.selectAll("path").data(geojson.features);
  
        newYork
            .enter()
            .append("path")
            .attr("d", geoGenerator)
            .attr("stroke", "black")
            .attr("stroke-width", 5)
            .attr("fill", "white");
    }
  
    d3.json("data/new-york2.geojson").then(function(json) {
      drawMap(json); 
    });

    function drawPoints(json, color) {
        // let geoGenerator = d3.geoPath().pointRadius(5).projection(projectionPoint);
        points = svg.selectAll(".circles").data(json.features);
  
        points
            .enter()
            .append("circle")
            .attr("fill", color)
            .attr("cx", function (d) {
                return projection(d.geometry.coordinates)[0];
            })
            .attr("cy", function (d) {
                return projection(d.geometry.coordinates)[1];
            })
            .attr("r", 5)
            .attr("fill", color)
            .attr("class", "dots")
            .style("opacity", 0.5)
            .on("mouseover", handleMouseoverMap)
            .on("mouseout", handleMouseoutMap);
            }
            
  
        d3.json("data/locations.json").then(function(json) {
            drawPoints(json["SUFFOLK"], "#255957"); 
            drawPoints(json["NASSAU"], "#A98743");
            drawPoints(json["WESTCHESTER"], "#F7C548");
    });
    tooltipMap = d3.select("#map-container").append("tooltip").attr("class", "tooltip");
};

function handleMouseoverMap(e, d) {
    console.log(d) 
    d3.select(this)
        .style("opacity", 1)
        // .transition()
        .attr("r", "15")
        .attr("stroke", "black")
        .attr("stroke-width", "3px");

  tooltipMap
        .style("opacity", 1)
        .style("position", "absolute")
        .style("border", "solid")
        .style("border-width", "5px")
        .style("background-color", "white")
        .style("left", (e.pageX+20) + "px")
        .style("top", (e.pageY-10)+"px")
        .text("Library: " + d.properties.name + "\n | \n" + "Librarians:" + d.properties.librarians 
        + "\n | \n" + "Employees Hours: " + d.properties.employee_hours)
        .style("font-size", "15px") 
}

function handleMouseoutMap(e, d) {
    d3.select(this)
        .attr("r", 5)
        .attr("stroke", null)
        .style("opacity", 0.5);

    tooltipMap.style("opacity", 0);
  }


let change = function (data){dropDown.on("change", function() {
    selectedCounty = dropDown.property("value");

    dataCounty = data.filter(function(d) {
        return d.County == selectedCounty;
    });

    selectedCounty = dropDown.property("value");

    dataCounty = data.filter(function(d) {
        return d.County == selectedCounty;
    });

    dataCounty.sort((a, b) => (a["Library Name"] > b["Library Name"]) ? 1 : -1);

    libraries = [];
    for (i in dataCounty) {
        lib = dataCounty[i]["Library Name"];
        libraries.push(lib);
    }

    // Remove existing bars from the SVG
    let svg1 = d3.select("#bar-chart-svg")
    

    yScaleBar.domain([
        0,
        d3.max(dataCounty, d => d["Print Collection"] + d["Digital Collection"] + d["Audio Collection"] + d["Downloadable Audio"] + d["Physical Video"])
    ]).range([svgheight - 250, 100]);
    ;

    // updated the xScaleBar domain
    xScaleBar.domain(libraries); 


    // Update x-axis
    svg1.select(".xAxis")
        .transition()
        .call(xAxisBar)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)");

    // Update y-axis
    svg1.select(".yAxis")
        .transition()
        .call(yAxisBar);
    
    stackedData = stack(dataCounty);
    svg1.selectAll("g.bars").remove();

    // // the groups and rectangles for the new data
    groups = svg1.selectAll("g.bars")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "bars")
        .style("fill", function(d) {
            return colorScale(d.key);
        })
        .style("stroke", "#000")

    rect = groups.selectAll("rect")
        .data(function(d) {
            return d;
        })
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return xScaleBar(d.data["Library Name"]);
        })
        .attr("y", function(d) {
            return yScaleBar(d[1]);
        })
        .attr("height", function(d) {
            return yScaleBar(d[0]) - yScaleBar(d[1]); // Adjusted height calculation
        })
        .attr("width", xScaleBar.bandwidth())
        .attr("stroke", "none")
        .attr("class", "rects");


    updateBarTooltip();   

    // code for updating scatter plot
    let svg2 = d3.select("#scatterplot-svg")

    xScaleScatter.domain([d3.min(dataCounty, d => d["Library Visits"]), d3.max(dataCounty, d => d["Library Visits"])]);
    yScaleScatter.domain([d3.min(dataCounty, d => d["Registered Users"]), d3.max(dataCounty, d => d["Registered Users"])]);


    svg2.selectAll(".circles").remove();

    // update x-axis
    svg2.select(".xAxis")
        .transition()
        .call(xAxisScatter)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)");

    // Update y-axis
    svg2.select(".yAxis")
        .transition()
        .call(yAxisScatter);

    svg2.selectAll(".circles")
        .data(dataCounty)
        .enter()
        .append("circle")
        .attr("class", "circles")
        .attr("cx", d => xScaleScatter(d["Library Visits"]))
        .attr("cy", d => yScaleScatter(d["Registered Users"]))
        .attr("r", 7)
        .attr("fill", "#05668d")
        .on("mouseover", handleMouseoverScatter)
        .on("mouseout", handleMouseoutScatter);

    //  code for updating the network diagram 
    let svg3 = d3.select("#network-svg")
    // svg3.selectAll(".link").remove(); 
    // svg3.selectAll(".node").remove();


    // svg3.selectAll("g.link").remove();
    // svg3.selectAll("g.node").remove();

    svg3.selectAll(".everything").remove()
    groupData = svg3.append("g").attr("class", "everything")
    
    d3.json("data/links.json").then(function (data) {
        dataUse = data[selectedCounty];
        // Extract nodes and links from the data
        const nodes = dataUse.nodes;
        const links = dataUse.links;

        let link = groupData.selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke", "grey")
            .style("stroke-width", 1)
            .on("mouseover", handleMouseoverNetworkLink)
            .on("mouseout", handleMouseoutNetworkLink); 
        
        const nodeElements = groupData
            .selectAll(".node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node");
        
        nodeElements
            .append("circle")
            .attr("fill", "#05668d")
            .attr("r", (d) => 10)
            .on("mouseover", handleMouseoverNetworkNode)
            .on("mouseout", handleMouseoutNetworkNode);
    
        const simulation = d3
            .forceSimulation(nodes)
            // .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(1000/2, 1000/2))
            .force("x", d3.forceX(1000/2))
            .force("y", d3.forceY(1000/2))
            .force("link", d3.forceLink(links).id(d => d.id).distance(700));

        simulation.on("tick", () => {
            // Update node  positions.
            // nodeElements.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
            nodeElements.attr("transform", d => `translate(${d.x},${d.y})`);
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        });

        let zoom = d3.zoom()
            .scaleExtent([1, 4])
            .translateExtent([[0,0], [svgwidth, svgheight]])
            .on("zoom", function(e) {
                groupData.attr("transform", e.transform); 
            })  
            groupData.call(zoom);  
    }); 
});
}; 
  

const filepath = "data/data_top_three.csv"
preproc(filepath);