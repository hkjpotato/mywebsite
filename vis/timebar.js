var globalBarData = [];
var globarlBarmargin,width_bar,height_bar,x_bar,y_bar,globalBarColor,svg_bar;

var bar_currDay = 1;
var bar_prevDay = bar_currDay;
var weekday_g = new Array(7);
weekday_g[0]=  "Sunday";
weekday_g[1] = "Monday";
weekday_g[2] = "Tuesday";
weekday_g[3] = "Wednesday";
weekday_g[4] = "Thursday";
weekday_g[5] = "Friday";
weekday_g[6] = "Saturday";


function formatTime(d,i){
  if ( i === 0 ) return '12a'
  if ( i === 12 ) return i + 'p';
  if ( i > 12 ) return i - 12 + 'p';
  return i + 'a';
}

function formatMinute(time) {
  var mind = time % (60 * 60);
  var minutes = Math.floor(mind / 60);

  var secd = mind % 60;
  var seconds = Math.ceil(secd);
  return minutes + "min" + seconds + "sec";
}




function init(){
     globarlBarmargin = {top: 20, right: 20, bottom: 30, left: 40};
     width_bar = 420 - globarlBarmargin.left - globarlBarmargin.right;
     height_bar = 450 - globarlBarmargin.top - globarlBarmargin.bottom;

     x_bar = d3.scale.linear().rangeRound([0, width_bar]);
     y_bar = d3.scale.ordinal().rangeRoundBands([0,height_bar],.1);
    globalBarColor = d3.scale.ordinal()
      .range(["#178DB4", "#A6E1F5"]).domain(["estimated_waiting_time", "duration"]);


    svg_bar = d3.select("#kjChart").append("svg")
      .attr("width", width_bar + globarlBarmargin.left + globarlBarmargin.right)
      .attr("height", height_bar + globarlBarmargin.top + globarlBarmargin.bottom)
      .append("g")
      .attr("transform", "translate(" + globarlBarmargin.left + "," + globarlBarmargin.top + ")");

    attachTimeLabel(svg_bar, height_bar);
    //var parseDate = d3.time.format("%Y-%m-%d %H:%M").parse;
    d3.json("./vis/uber.json", function(error, data){
      if (error) throw error;
      //get data for use
      var i = 0;
      var temp1 = [];
      for (var total = 0;total < 24;total++) {
        temp1.push(data[i]);
        i+=6;
      }
      var temp2 = [];
      for (var total = 0;total < 24;total++) {
        temp2.push(data[i]);
        i+=6;
      }
      var temp3 = [];
      for (var total = 0;total < 24;total++) {
        temp3.push(data[i]);
        i+=6;
      }
      var temp4 = [];
      for (var total = 0;total < 24;total++) {
        temp4.push(data[i]);
        i+=6;
      }
      var temp5 = [];
      for (var total = 0;total < 24;total++) {
        temp5.push(data[i]);
        i+=6;
      }
      var temp6 = [];
      for (var total = 0;total < 24;total++) {
        temp6.push(data[i]);
        i+=6;
      }
      var temp0 = [];
      for (var total = 0;total < 24;total++) {
        temp0.push(data[i]);
        i+=6;
      }

      globalBarData[0] = temp0;
      globalBarData[1] = temp1;
      globalBarData[2] = temp2;
      globalBarData[3] = temp3;
      globalBarData[4] = temp4;
      globalBarData[5] = temp5;
      globalBarData[6] = temp6;


      var currDay = 1;
      switchDay(currDay);
    });
};
      

function switchDay(currDay) {
      var data = globalBarData[currDay]
      data.forEach(function(d) {
          var x0 = 0;
          d.span = globalBarColor.domain().map(function(name) { 
            return {name: name, x0: x0, x1: x0 += +d[name]}; })
          d.total = d.span[d.span.length - 1].x1;
      });
      drawChart(globarlBarmargin, width_bar,height_bar, x_bar, y_bar, globalBarColor, svg_bar, data);
}     


function drawChart(globarlBarmargin, width_bar, height_bar, x, y, globalBarColor, svg, data) {
      svg.selectAll(".timestamp").remove();
      //finished data
      //identify domain
      x.domain([0, d3.max(data, function(d) { return d.total; }) * 4]);
      y.domain(data.map(function(d) { return d.timestamp; }));
      
      //attach timestamp
      var timestamp = svg.selectAll(".timestamp")
          .data(data)
          .enter().append("g")
          .attr("class", function(d,i) {
            return "timestamp hour"+i}) //FIXME no need to be g?!
          .attr("hour", function(d,i) {
            return i;
          })
          .attr("transform", function(d) { return "translate(0,"+ y(d.timestamp) + ")"; });

      //attach timetext
      timestamp.append("text")
          .attr("x", function(d) { 
            return x(d.total + 50); 
          })
          .attr("class", function(d, i) {
            return "barText hour"+i;
          })
          .attr("y", 10)
          .attr("dy", ".5em")
          .style({"font-size": "12px", "fill": "#0a3866"})
          .text(function(d) { return formatMinute(d.total); });
      
      var hour = 0;
      //attach rect
      timestamp.selectAll("rect")
          .data(function(d) { return d.span; })
          .enter().append("rect")
          .attr("class", function(d, i) {
            if (i == 0) {
              return "timebar wait";
            } else if (i == 1) {
              return "timebar duration";
            }
          })
          .attr("type", function(d, i) {
            if (i == 0) {
              return "wait";
            } else if (i == 1) {
              return "duration";
            }
          })
          .attr("value", function(d) {
            return (d.x1 - d.x0);
          })
          .attr("hour", function() {
            var currHour = Math.floor(hour/2);
            hour++;
            return currHour;
          })
          .attr("height", y.rangeBand())
          .attr("x", function(d) { return x(d.x0); })
          .attr("width", 0)
          .transition()
          .duration(function(d, i) {
            console.log(d);
            return (i ? 1000 : 800);
          })
          .delay(function(d, i) {
            return i * 300;
          })
          .attr("width", function(d) { return x(d.x1) - x(d.x0); })
          .style("fill", function(d) { return globalBarColor(d.name); });
      //rect mouse event
      timestamp.selectAll(".timebar")
        .on("mouseenter", function() {
          console.log(this);
          var thisNode = d3.select(this);
          thisNode.transition()
            .style("opacity", 0.3)
        })
        .on("mouseover", function() {
          var thisNode = d3.select(this);
          var hour = thisNode.attr("hour");
          d3.selectAll(".timestamp.hour"+hour)
          .append("text")
          .attr("x", function(d) { 
            return thisNode.attr("x"); 
          })
          .attr("dx", function(d) {
            if (thisNode.attr("type") == "duration") {
              return ".5em"; 
            }
          })
          .attr("class", function(d, i) {
            return "tempText";
          })
          .attr("y", 0)
          .attr("dy", "1em")
          .style("font-size", "15px")
          .style("pointer-events", "none")
          .style("fill", function(d, i) {
            console.log(i);
            if (thisNode.attr("type") == "wait") {
              return "#ff8c19";
            } else {
              return "#ffba75";
            }
          })
          .text(function(d) { return  formatMinute(thisNode.attr("value")); });
        })
        .on("mouseout", function(){
          var thisNode = d3.select(this);
          thisNode.transition()
            .style("opacity", 1);
          var hour = thisNode.attr("hour");
          console.log(d3.selectAll(".tempText.hour"+hour));
          d3.selectAll(".tempText").remove();
        });
}



function attachTimeLabel(svg, height_bar) {
  var timeTextTopPad = 15;
  var timeTextBottomPad = 10;
  var timeTextInterval = 10

  var timeTextScale = d3.scale.linear().range([timeTextTopPad, height_bar - timeTextTopPad - timeTextBottomPad]).domain([0, 23]);

  svg.append("g").attr("class", "timetext").attr("fill","black").style("text-anchor","middle")
  .selectAll(".hours").data(new Array(24))
  .enter().append("text").attr("class", function(d,i) {
      console.log("hours hour"+i);
      return "hours hour"+i})
  .attr("hour", function(d, i){
    return i;
  })
  .text(formatTime)
  .attr("x", function(){
    return -15;
  })
  .attr("y",function(d,i){ return timeTextScale(i) + timeTextInterval; })
  .style("font-size", "12px")
  .attr("opacity", 0)
  .on("mouseover", function(){
    var thisNode = d3.select(this);
    console.log(thisNode);
    var hour = thisNode.attr("hour");
    thisNode.style("font-size", "18px");
    d3.selectAll(".barText.hour" + hour)
      .style("fill", "#0a3866").style("font-size", "18px");
  })
  .on("mouseout", function(){
    var thisNode = d3.select(this);
    var hour = thisNode.attr("hour");
    thisNode.style("font-size", "12px");
    d3.selectAll(".barText.hour" + hour)
      .style("fill", "#0a3866").style("font-size", "12px");
  })
  .transition().duration(1000).delay(function(d,i){ return i * 10; })
  .attr("opacity",1);
}

function update_timebar(data) {
     d3.select("#kjChart").html("");
     globarlBarmargin = {top: 20, right: 20, bottom: 30, left: 40};
     width_bar = 650 - globarlBarmargin.left - globarlBarmargin.right;
     height_bar = 600 - globarlBarmargin.top - globarlBarmargin.bottom;

     x_bar = d3.scale.linear().rangeRound([0, width_bar]);
     y_bar = d3.scale.ordinal().rangeRoundBands([0,height_bar],.1);
     globalBarColor = d3.scale.ordinal()
      .range(["#178DB4", "#A6E1F5"]).domain(["estimated_waiting_time", "duration"]);


    svg_bar = d3.select("#kjChart").append("svg")
      .attr("width", width_bar + globarlBarmargin.left + globarlBarmargin.right)
      .attr("height", height_bar + globarlBarmargin.top + globarlBarmargin.bottom)
      .append("g")
      .attr("transform", "translate(" + globarlBarmargin.left + "," + globarlBarmargin.top + ")");

    attachTimeLabel(svg_bar, height_bar);
    //var parseDate = d3.time.format("%Y-%m-%d %H:%M").parse;

    //get data for use
    var i = 0;
    var temp1 = [];
    for (var total = 0;total < 24;total++) {
      temp1.push(data[i]);
      i+=6;
    }
    var temp2 = [];
    for (var total = 0;total < 24;total++) {
      temp2.push(data[i]);
      i+=6;
    }
    var temp3 = [];
    for (var total = 0;total < 24;total++) {
      temp3.push(data[i]);
      i+=6;
    }
    var temp4 = [];
    for (var total = 0;total < 24;total++) {
      temp4.push(data[i]);
      i+=6;
    }
    var temp5 = [];
    for (var total = 0;total < 24;total++) {
      temp5.push(data[i]);
      i+=6;
    }
    var temp6 = [];
    for (var total = 0;total < 24;total++) {
      temp6.push(data[i]);
      i+=6;
    }
    var temp0 = [];
    for (var total = 0;total < 24;total++) {
      temp0.push(data[i]);
      i+=6;
    }

    globalBarData[0] = temp0;
    globalBarData[1] = temp1;
    globalBarData[2] = temp2;
    globalBarData[3] = temp3;
    globalBarData[4] = temp4;
    globalBarData[5] = temp5;
    globalBarData[6] = temp6;

    var currDay = 1;
    switchDay(currDay);

}
