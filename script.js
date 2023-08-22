
const classes = ['Non-Covid', 'Covid'];

function parseData(d) {
    d.file = d.file;
    d.x = +d.x;
    d.y = +d.y;
    d.label = +d.label;
    return d;
}

function calcDistances(data, d){
    return data.map((point) => {
        const dx = d.x - point.x;
        const dy = d.y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    });
}

function getIndices(distances, n){
    return distances
        .map((distance, index) => ({distance, index}))
        .sort((a, b) => a.distance - b.distance)
        .slice(1, n+1)
        .map((item) => item.index);
}

// Set up the d3 canvas
function canvas(data){
    const margin = {top: 30, right: 20, bottom: 30, left: 50};
    const width = 1200 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const svg = d3.select("#scatterPlot")
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.x; }))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.y; }))
        .range([height, 0]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));
    
    return { svg, colorScale, xScale, yScale, width };
}

// Plot the points
function plot(svg, data, xScale, yScale, colorScale, n) {
    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("position", "absolute")
                        .style("display", "none")
                        .style("pointer-events", "none")
                        .style("background-color", "rgba(0, 0, 0, 0.7)")
                        .style("color", "white")
                        .style("padding", "5px")
                        .style("border-radius", "5px");

    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 3)
        .style("fill", (d) => colorScale(d.label))
        .on("click", (event, d) => {
            const distances = calcDistances(data, d);
            const indices = getIndices(distances, n);
            svg.selectAll("circle")
                .style("stroke", (d, i) => indices.includes(i) ? "black" : "none")
                .style("stroke-width", (d, i) => indices.includes(i) ? 2 : 0);            
            
            tooltip.style("display", "block")
                .style("left", "1300px")
                .style("top", "400px")
                .html(`
                    <p>point label: ${classes[d.label]}</p>
                    <img src="images/${d.file}" width="200" height="200">`
                    );
        });
        /*.on("mouseout", () => {            
            tooltip.style("display", "none");
        });*/
}

// Legend
function displayLegend(svg, colorScale, width) {
    const legend = svg.selectAll(".legend")
                        .data(colorScale.domain())
                        .enter().append("g")
                        .attr("class", "legend")
                        .attr("transform", (d, i) => "translate(0," + i * 20 + ")");
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", colorScale);
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .style("text-anchor", "end")
        .text((d) => classes[d]);
}

function main() {
    let n = 7;

    d3.csv("annotations_file.csv").then(function(data) {
        data.forEach(parseData);
        const { svg, colorScale, xScale, yScale, width } = canvas(data);

        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on("zoom", zoomed);
        
        svg.call(zoom);

        function zoomed(event){
            const transform = event.transform;
            svg.attr("transform", transform);
            svg.selectAll("circle")
                .attr("cx", d => xScale(d.x) * transform.k + transform.x)
                .attr("cy", d => yScale(d.y) * transform.k + transform.y);

            const newX = transform.rescaleX(xScale);
            const newY = transform.rescaleY(yScale);

            svg.select(".x-axis")
                .call(d3.axisBottom(newX));
            svg.select(".y=axis")
                .call(d3.axisLeft(newY));
        }

        function updatePlot() {
            svg.selectAll("*").remove();
            plot(svg, data, xScale, yScale, colorScale, n);
            displayLegend(svg, colorScale, width);
        }

        const slider = document.getElementById("slider");
        const sliderValueElement = document.getElementById("sliderValue");

        slider.addEventListener("input", function() {
            n = parseInt(slider.value);
            sliderValueElement.textContent = n;
            updatePlot();
        });
        
        updatePlot();
    });
}

