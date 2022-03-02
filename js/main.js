let clientId = 1009;
let keyDate = "2022-02-11"; // updated by PYEE for testing
let keyDateSplit = keyDate.split("-");
let keyDateFormatted = new Date(keyDateSplit[0],+keyDateSplit[1]-1,keyDateSplit[2]);

d3.select( ".clientSelect")
    .on("change", function(d){
        clientId = +this.value;
        resetChart();
    })

d3.select( ".dateSelect")
    .on("change", function(d){
        keyDate = this.value;
        keyDateSplit = keyDate.split("-");
        keyDateFormatted = new Date(keyDateSplit[0],+keyDateSplit[1]-1,keyDateSplit[2]);
        resetChart();
    })

resetChart();

function resetChart(){
    var promises = [
        d3.json("https://prod-97.westus.logic.azure.com:443/workflows/909974398dd34ff3a28a0c468e54d2be/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=7gRYpMmX2thjblij6wfcbJMePRg9pFrr_Ppz-blAxbU",
            {method: "POST",body:JSON.stringify({client_id:clientId,key_date:keyDate,n:25}),headers:{"Content-Type":"application/json"}}),
        d3.json("https://prod-44.westus.logic.azure.com:443/workflows/f813d130506449c7aaf7e99e00776141/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=e-6x-Szn7DEoQDwAVwCSWmWXsJMFoQbMEV2VJbN6Suk"),
        d3.json("https://prod-129.westus.logic.azure.com:443/workflows/7f48f62137f54267a91e4b83687a2f83/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=F6ozaxNeplqKgzgQ7vgbV6_dKx97cHcLrKCxwB3eY1Y",
            {method: "POST",body:JSON.stringify({client_id:clientId}),headers:{"Content-Type":"application/json"}}),
        d3.json("https://prod-177.westus.logic.azure.com:443/workflows/c5fcf01bfec54a25a6a7a5a41c981d35/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=K1iAuIu-VbhfketSSHWOe5hHt2AO_lx0N8z_ceSNXK8",
            {method: "POST",body:JSON.stringify({client_id:clientId}),headers:{"Content-Type":"application/json"}}),
        d3.json("data/usStates.json"),
        d3.json("https://prod-105.westus.logic.azure.com:443/workflows/96b20533cfe147428096931541df7ec8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=6Exj1Po-4hS1tQSNQzv4dVmp85h8L_uIgwOjfxXAuaA"),
        d3.csv("data/prod_data_1009.csv"),
         d3.csv("data/loe_monthly_data.csv")
    ]
    Promise.all(promises).then(ready);

}


function ready(all_datasets) {
    debugger;

    //ALL DATASETS
    //0 - aggregated individual well data (ie actual/forecast etc)
    //1 - json structure
    //2 - colour by well
    //3 - groups, wells within each + sort order
    //4/5 - map and county map (can be compressed)
    //6 - well information - names etc.. (by client id - should it not be filtered already?
    //7 - csv

    var wellsN = 25;
    mallMap.maxDepth = 4;
    mallMap.myWellCount = wellsN;
    all_datasets[0] = all_datasets[0][0];
    //filter ytd data to current client
    all_datasets[6] = all_datasets[6].filter(f => +f.client_id === clientId);

    //all_datasets[7] = all_datasets[7].filter(f => convertDate(f.date) >= new Date(2021,7,1));
    //all_datasets[8] = all_datasets[8].filter(f => +f.client_id === clientId);
    //all_datasets[8] = all_datasets[8].filter(f => convertLOEDate(f.date) >= new Date(2021,7,1));

    d3.selectAll(".slider")
        .on("input",function(d){
            d3.select("#" + this.id + "_val").html(this.value);
        })
        .on("change",function(d){
            if(this.id ==="n"){
                wellsN = this.value;
                mallMap.myWellCount = wellsN;
                setWellExtraData();
                mallMap.wellExtraData = wellExtraData;
            } else {
                mallMap.maxDepth = +this.value;
            }
            mallMap.allDepthData = JSON.parse(JSON.stringify(all_datasets[1]));
            mallMap.allDepthData.colors = {"functional":"#F0F0F0"};
            mallMap.allDepthData.children = addColour(mallMap.allDepthData.children,1000);
            mallMap.mainData = JSON.parse(JSON.stringify(all_datasets[1]));
            mallMap.mainData.colors = {"functional":"#F0F0F0"};
            mallMap.mainData.children = addColour(mallMap.mainData.children,mallMap.maxDepth);
            drawDashboard(mallMap.mainData,mallMap.mapData,"chart_div","breadcrumb_div","footer_div","extra_chart_div");

        })
    //convert all_datasets[0] (prod-97) into wellExtraData format
    var wellExtraData = {}
    setWellExtraData();
    //save global vars
    mallMap.wellExtraData = wellExtraData;
    mallMap.tooltipExtraFields = all_datasets[0].tooltipExtraFields;

    const clientWellData = all_datasets[5].find(f => f.client_id === clientId);
    mallMap.wellData = clientWellData.well_data;
    //filter out wells in csv that do not exist in well data
    all_datasets[6].map(m => m.well_id = +m.well_id);
    all_datasets[6].filter(f =>  mallMap.wellData.filter(w => w.well_id === f.well_id).length > 0)
    let barMenuGroups = [];
    clientWellData.menu_groups.forEach(d => barMenuGroups.push(d.group));
    mallMap.barMenuGroups = barMenuGroups;
    mallMap.revenueData = all_datasets[6];
    mallMap.revenueData.map(m => m.date = convertDate(m.date))
    mallMap.LOEData = all_datasets[7];
    mallMap.LOEData.map(m => m.date = convertDate(m.date))
    mallMap.extraChartData = mallMap.revenueData;

    // mallMap.extraChartDataLOE.map(m => m.date = convertLOEDate(m.date))
    //build colourMatrix, matrixWellIds + groupNames from all_datasets[2] - prod-129
    wellNames = {},wellsByGroup = {};
    var colourMatrix = {}, matrixWellIds = new Set(), groupNames = new Set(), curatedNames = new Set(), wellsByGroup = {}, wellsByCurated = {};
    setColorsAndGroups();
    //this data is used to:
    //now add colours, and start/end dates or ExtraData if it is provided for relevant node
    var dateNodes = {};

    //first run of data
    all_datasets[1] = all_datasets[1][0];
    mallMap.allDepthData = JSON.parse(JSON.stringify(all_datasets[1]));
    mallMap.allDepthData.colors = {"functional":"#F0F0F0"};
    mallMap.allDepthData.children = addColour(mallMap.allDepthData.children,1000);

    mallMap.mainData = JSON.parse(JSON.stringify(all_datasets[1]));
    mallMap.mainData.colors = {"functional":"#F0F0F0"};
    mallMap.mainData.children = addColour(mallMap.mainData.children,mallMap.maxDepth);
    //set final global variables
    mallMap.dateNodes = dateNodes;
    mallMap.wellNames = wellNames;
    mallMap.mapData = all_datasets[4];
    //draw dashboard
    drawDashboard(mallMap.mainData,mallMap.mapData,"chart_div","breadcrumb_div","footer_div","extra_chart_div");
    setRadioFunctionality();
    function addColour(myChildren,maxDepth){
        //for each child
        myChildren.forEach(function(c){
            //loop through children
            if(c.colors === undefined){
                //set default for functional if a color is not defined
                c.colors = {"functional":"#F0F0F0"};
            }
            //add any defined colours to the c.colors
            if(colourMatrix[c.id] !== undefined){
                colourMatrix[c.id].forEach(function(m){
                    c.colors[m.well_id] = m.color;
                })
            }
            //if highlight_date_offset, populate dateNodes with start+end date
            if(c.highlight_date_offset !== undefined){
                var endDate = d3.timeDay.offset(keyDateFormatted,-c.highlight_date_offset + 1);
                var startDate = d3.timeDay.offset(endDate,-(c.highlight_day_count));
                dateNodes[c.id] = [startDate,endDate]
            }
            if(c.children !== undefined){
                if(c.node_level < maxDepth){
                    addColour(c.children,maxDepth);
                } else {
                    c._children = c.children;
                    c.children = undefined;
                    addColour(c._children,maxDepth);
                }
                //continue till you run out of children

            } else {
                if (wellExtraData[c.id] !== undefined){
                    //for children that have extra data, add the extra data (generally wells)
                    var extraChildren = [];
                    //this is currently hard coded..
                    var sortType = c.name === "Beat" ? "descending" : "ascending";

                    wellExtraData[c.id].forEach(function(w,i){
                        extraChildren.push({
                            "value":c.value/mallMap.myWellCount,
                            "name":w.well_name,
                            "relativeValue":c.value * w.relativeDifference,
                            "id": c.id + (i+1) + "-",
                            "difference":w.actual - w.target,
                            "group":c.name,
                            "group_color":w.node_color,
                            "target": w.target,
                            "actual":w.actual,
                            "colors":{"functional":w.node_color},
                            "node_level":c.node_level + 1,
                            "well_id":w.well_id,
                            "node_rank":w.node_rank,
                            "tooltip_type":w.tooltip_type,
                            "delta":w.delta,
                            "delta_flag":w.delta_flag,
                        })
                    })
                    //sort extra children, and add.
                    extraChildren = extraChildren.sort((a,b) =>
                        d3[sortType](a.relativeValue,b.relativeValue));
                    //marker used to show if data added
                    c.wellDataAdded = true;
                    if(c.node_level < maxDepth){
                        c.children = extraChildren;
                    } else {
                        c._children = extraChildren;
                    }

                }
            }
        })
        return myChildren;
    }
    function convertDate(myDate){
        myDate = myDate.split("/");
        return new Date(myDate[2],+myDate[0]-1,myDate[1]);
    }

    function convertLOEDate(myDate){
        myDate = myDate.split("/");
        return new Date(myDate[2],+myDate[1]-1,myDate[0]);
    }

    function setWellExtraData(){
        var nodeIds = new Set();
        all_datasets[0].data.forEach(d => nodeIds.add(d.node_id));
        nodeIds = Array.from(nodeIds.values());
        nodeIds.forEach(function(n){
            wellExtraData[n] = all_datasets[0].data.filter(f => f.node_id === n);
            wellExtraData[n] = wellExtraData[n].filter(f => f.node_rank <= wellsN);
            var totalDifference = d3.sum(wellExtraData[n],s => s.actual - s.target);
            wellExtraData[n].forEach(w => w.relativeDifference = (w.actual - w.target)/totalDifference)
        })
    }
    function setColorsAndGroups(){
        var excludeKeys = ['client_id', 'well_id', 'well_or_group', 'name', 'well_count_for_reservoir','current_status','reservoir'];
        all_datasets[2].forEach(function(d){
            var myNodes = Object.keys(d).filter(f => excludeKeys.indexOf(f) === -1);
            myNodes.forEach(function(n){
                if(colourMatrix[n] === undefined){
                    colourMatrix[n] = [{"well_id":d.well_id === undefined ? d.name : d.well_id,"color":d[n]}]
                } else {
                    colourMatrix[n].push({"well_id":d.well_id === undefined ? d.name : d.well_id,"color":d[n]});
                }
                if(d.well_or_group === "group"){
                    //do not do anything
                } else {
                    matrixWellIds.add(d.well_id);
                    wellNames[d.well_id] = d.name;
                }
            })
        })
        //build wellsByGroup
        matrixWellIds = Array.from(matrixWellIds.values());
        all_datasets[3].forEach(d => d.group_type === "GROUPS" ? groupNames.add(d.group_name) : curatedNames.add(d.group_name));
        groupNames = Array.from(groupNames.values());
        groupNames.forEach(function(d){
            var myWells = all_datasets[3].find(f => f.group_name === d).wells;
            var myIds = [];
            myWells.forEach(f => myIds.push(f.well_id));
            wellsByGroup[d] = myIds;
        })
        curatedNames = Array.from(curatedNames.values());
        curatedNames.forEach(function(d){
            var myWells = all_datasets[3].find(f => f.group_name === d).wells;
            var myIds = [];
            myWells.forEach(f => myIds.push(f.well_id));
            wellsByCurated[d] = myIds;
        })
    }

    function setRadioFunctionality(){

        mallMap.currentWellIds = [];
        //adds an input, span + break for every groupName
        var divGroup = d3.select("#group_div").selectAll('.groupDivInputs')
            .data(groupNames)
            .join(function(group){
                var enter = group.append("g").attr("class","groupDivInputs");
                enter.append("input").attr("class","groupInput");
                enter.append("span").attr("class","groupInputLabel");
                enter.append("br");
                return enter;
            });

        divGroup.select(".groupInput")
            .attr("id","group")
            .attr("y",(d,i) => (i*12))
            .attr("type","radio")
            .attr("class","datasetChoice")
            .attr("name","datasetChoice")
            .attr("value", d => d);

        divGroup.select(".groupInputLabel")
            .attr("x",30)
            .attr("y",(d,i) => (i*12))
            .html(d => d + " (" + wellsByGroup[d].length + ")");

        //checking the first on the list which is always All
        document.getElementById("group").checked = true

        //adds an input, span + break for every groupName
        var divGroup = d3.select("#curated_div").selectAll('.curatedDivInputs')
            .data(curatedNames)
            .join(function(group){
                var enter = group.append("g").attr("class","curatedDivInputs");
                enter.append("input").attr("class","curatedInput");
                enter.append("span").attr("class","curatedInputLabel");
                enter.append("br");
                return enter;
            });

        divGroup.select(".curatedInput")
            .attr("id","curatedGroup")
            .attr("y",(d,i) => (i*12))
            .attr("type","radio")
            .attr("class","datasetChoice")
            .attr("name","datasetChoice")
            .attr("value", d => d);

        divGroup.select(".curatedInputLabel")
            .attr("x",30)
            .attr("y",(d,i) => (i*12))
            .html(d => d + " (" + wellsByCurated[d].length + ")");

        //populates Wells based on default.
        populateWells(matrixWellIds);


        function populateWells(myDataset){

            //sort by well name
            myDataset = myDataset.sort((a,b) => d3.ascending(wellNames[a],wellNames[b]));
            //adds an input, span + break for every well in the selected Group
            var wellGroup = d3.select("#well_div").selectAll('.wellDivInputs')
                .data(myDataset, d => d)
                .join(function(group){
                    var enter = group.append("g").attr("class","wellDivInputs");
                    enter.append("input").attr("class","wellInput");
                    enter.append("span").attr("class","wellInputLabel");
                    enter.append("br");
                    return enter;
                });

            //note all elements in the radio menu have the class datasetChoice..
            wellGroup.select(".wellInput")
                .attr("id",d => "radio_" + d)
                .attr("y",(d,i) => (i*12))
                .attr("type","radio")
                .attr("class","datasetChoice")
                .attr("name","datasetChoice")
                .attr("value", d => d);

            wellGroup.select(".wellInputLabel")
                .attr("x",30)
                .attr("y",(d,i) => (i*12))
                .html(d => wellNames[d].substr(0,30));

            //reset datasetChoice functionality every time wells are repopulated (as some may be different/new)
            d3.selectAll(".datasetChoice")
                .on("change",function(d){
                    //set wellIds assuming just one well
                    var wellIds = [+this.value];
                    if(this.id === "group"){
                        //if it is a group, repopulate well and wellIds (multiple)
                        populateWells(wellsByGroup[this.value]);
                        wellIds = wellsByGroup[this.value];
                        d3.select(".barTitleextra_chart_div").text(this.value);
                    } else if(this.id === "curatedGroup"){
                        //if it is a group, repopulate well and wellIds (multiple)
                        populateWells(wellsByCurated[this.value]);
                        wellIds = wellsByCurated[this.value];
                        d3.select(".barTitleextra_chart_div").text(this.value);
                    } else if(this.id === "functional"){
                        //if functional set wellIds to empty, so all data shown by default
                        wellIds = [];
                        d3.select(".barTitleextra_chart_div").text("ALL");
                    }
                    if (wellIds.length === 1) {
                        d3.select("." + mallMap.extraChartDivId  + "Svg").selectAll("*").remove();
                        mallMap.currentExtraChart = "bar";
                        //disable/enable tile button depending on whether 1 or multiple/zero wells
                        disableButtons(".buttonGroupfooter_div#tile");
                    } else {
                        enableButtons(".buttonGroupfooter_div#tile");
                    }
                    //set global vars
                    mallMap.currentWellIds = wellIds;
                    mallMap.selectedColor = this.value;
                    //clone data
                    var myExtraData = JSON.parse(JSON.stringify(mallMap.extraChartData));
                    if(wellIds.length > 0){
                        //if wellIds is not empty, filter data
                        myExtraData = myExtraData.filter(f => wellIds.indexOf(+f.well_id) > -1);
                    }
                    //drawDashboard
                    drawDashboard(mallMap.mainData, mallMap.mapData,"chart_div","breadcrumb_div","footer_div","extra_chart_div",myExtraData);
                    d3.select(".barTitleextra_chart_div").text(mallMap.wellNames[this.value]);

                });
        }
    }
};
