

function initialiseDashboard(myData,mapData,divId,breadcrumbDivId,footerDivId,extraChartDivId,filteredBarData){

    //draw svg for breadcrumb,chart and footer
    drawSvg(divId,true);
    drawSvg(breadcrumbDivId,false);
    drawSvg(footerDivId,false);
    drawSvg(extraChartDivId,false);
    //draw map + minimap in footer
    drawMallMap(myData,divId,breadcrumbDivId);
    drawMiniMallMap(myData,footerDivId);
    mallMap.extraChartDivId = extraChartDivId;
    drawStackedBar(filteredBarData);

}

function drawMallMap(myData,divId,breadcrumbDivId){

    var svg = d3.select("." + divId + "Svg");
    var width = +svg.attr("width");
    var height = +svg.attr("height");

    mallMap.sunburstChart = mallMapChart()
        .width(width)
        .height(height)
        .myData(myData)
        .myClass(divId)
        .selectedColor(mallMap.selectedColor)
        .breadcrumbSvg(breadcrumbDivId + "Svg");

    mallMap.sunburstChart(svg);
}

function drawMiniMallMap(myData,divId){

    var svg = d3.select("." + divId + "Svg");
    var height = +svg.attr("height");
    var width = height;

    var my_chart = miniMallMapChart()
        .width(width)
        .height(height)
        .myData(myData)
        .myClass(divId);

    my_chart(svg);
}

function drawTooltipMallMap(myData,divId,selectedColor){

    var svg = d3.select("." + divId + "Svg");
    var height = +svg.attr("height");
    var width = +svg.attr("width");

    var my_chart = tooltipMallMapChart()
        .width(width)
        .height(height)
        .myData(myData)
        .myClass(divId)
        .selectedColor(selectedColor);

    my_chart(svg);
}

function drawWellMap(){

    d3.select("." + mallMap.extraChartDivId  + "Svg").selectAll("*").remove();
    var svg = d3.select("." + mallMap.extraChartDivId + "Svg");
    svg.append("g").attr("class","zoomSvg" + mallMap.extraChartDivId);
    var height = +svg.attr("height");
    var width = +svg.attr("width");

    var groupedByWell = Array.from(d3.rollup(mallMap.extraChartData,
            v => d3.sum(v, s => Math.abs(s.actual_revenue_minus_royalty - s.ipc_revenue_minus_royalty)), d => d.well_id));
    var myData = [];
    groupedByWell.forEach(function(d){
        var oneWell = mallMap.wellData.find(f => f.well_id === d[0]);
        if(+oneWell.longitude_surface !== 0){
            myData.push({
                "well_id": d[0],
                "difference":d[1],
                "wellName": oneWell.well_name,
                "long_lat":[+oneWell.longitude_surface,+oneWell.latitude_surface],
                "ipc": d3.sum(mallMap.extraChartData, s => s.well_id === d[0] ? s.ipc_revenue_minus_royalty : 0),
                "actual": d3.sum(mallMap.extraChartData, s => s.well_id === d[0] ? s.actual_revenue_minus_royalty : 0),
            })
        }
    })

    var my_chart = wellMap()
        .width(width)
        .height(height)
        .myData(myData)
        .myClass(mallMap.extraChartDivId)
        .mapData(mallMap.mapData);

    my_chart(svg);
}

function drawStackedBar(filteredData){

    if(mallMap.currentExtraChart !== "bar"){
        mallMap.currentExtraChart = "bar";
        //quick win, will make this better
        d3.select("." + mallMap.extraChartDivId  + "Svg").selectAll("*").remove();
    }
    var svg = d3.select("." + mallMap.extraChartDivId + "Svg");
    var height = +svg.attr("height");
    var width = +svg.attr("width");
    var margins = {"left":width*0.2,"right":width*0.2,"top":height*0.2,"bottom":height*0.2};

    mallMap.stackedBarChart = stackedBarChart()
        .width(width*0.6)
        .height(height*0.6)
        .margins(margins)
        .barDateRange(mallMap.barDateRange)
        .yAxisTransitionTime(filteredData === undefined ? 0 : 1000)
        .myData(filteredData === undefined ? mallMap.extraChartData : filteredData)
        .myClass(mallMap.extraChartDivId );

    mallMap.stackedBarChart(svg);
}

function drawLineMultiples(){

    var wellIds = new Set();
    var selectedData = mallMap.wellExtraData[mallMap.selectedParentNode];
    if(selectedData === undefined){
        selectedData = [];
        var myKeys = Object.keys(mallMap.wellExtraData).filter(f => f.includes(mallMap.selectedParentNode));
        myKeys.forEach(k => selectedData = selectedData.concat(mallMap.wellExtraData[k]))
    }
    selectedData.forEach(d => wellIds.add(d.well_id));
    var chartData = [];
    wellIds.forEach(d => chartData = chartData.concat(mallMap.extraChartData.filter(f => +f.well_id === d)));
    chartData.map(m =>  m.ipc_delta_flag = selectedData.find(f => f.well_id === +m.well_id).ipc_delta_flag);
    //quick win, will make this better
    d3.select("." + mallMap.extraChartDivId  + "Svg").selectAll("*").remove();
    var svg = d3.select("." + mallMap.extraChartDivId  + "Svg");

    var height = +svg.attr("height");
    var width = +svg.attr("width");
    var margins = {"left":10,"right":10,"top":30,"bottom":10};

    var my_chart = lineMultipleChart()
        .width(width)
        .height(height)
        .margins(margins)
        .myData(chartData)
        .myClass(mallMap.extraChartDivId );

    my_chart(svg);
}


function drawPyramid(){

    //quick win, will make this better
    d3.select("." + mallMap.extraChartDivId  + "Svg").selectAll("*").remove();
    var svg = d3.select("." + mallMap.extraChartDivId  + "Svg");

    var selectedData = mallMap.wellExtraData[mallMap.selectedParentNode];
    if(selectedData === undefined){
        selectedData = [];
        var myKeys = Object.keys(mallMap.wellExtraData).filter(f => f.includes(mallMap.selectedParentNode));
        myKeys.forEach(k => selectedData = selectedData.concat(mallMap.wellExtraData[k]))
    }

    var height = +svg.attr("height");
    var width = +svg.attr("width");
    var margins = {"left":50,"right":50,"top":50,"bottom":30};

    var my_chart = pyramidChart()
        .width(width)
        .height(height)
        .margins(margins)
        .myData(selectedData)
        .myClass(mallMap.extraChartDivId);

    my_chart(svg);
}

function drawSvg(divId,zoomSvg){

    var chart_div = document.getElementById(divId);
    var width = chart_div.clientWidth;
    var height = chart_div.clientHeight;

    if(d3.select("." + divId + "Svg")._groups[0][0] === null){
        var svg = d3.select("#" + divId)
            .append("svg")
            .attr("class",divId + "Svg")
            .attr("id",divId)
            .attr("width",width)
            .attr("height",height);

        if(zoomSvg === true){
            //zoomSvg and texture added for main chart svg
            svg.append("g").attr("class","zoomSvg" + divId);
            mallMap.texture = textures.lines().size(4).strokeWidth(0.5).stroke("white");
            svg.call(mallMap.texture);
        }

    } else {
        var svg = d3.select("." + divId + "Svg");
    }
    return svg;
}


