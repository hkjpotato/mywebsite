var myIcon_frame_bg_color = "#545454";
var titleColor = "#afafaf";
var shadowColor = "#afafaf";
var keyShadowColor = "#ff4d4d";

function explore() {
    $('#animationContainer').css({
      display: 'none'
    });
    $('#vis').css({
      display: 'block'
    });
    init();
}

$(document).ready(
  function() {
    // browser check
    function get_browser(){
      var ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []; 
      if(/trident/i.test(M[1])){
          tem=/\brv[ :]+(\d+)/g.exec(ua) || []; 
          return {name:'IE',version:(tem[1]||'')};
          }   
      if(M[1]==='Chrome'){
          tem=ua.match(/\bOPR\/(\d+)/)
          if(tem!=null)   {return {name:'Opera', version:tem[1]};}
          }   
      M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
      if((tem=ua.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
      return {
        name: M[0],
        version: M[1]
      };
    }

    function checkBrowser() {
     var browser = get_browser();
     console.log(browser);
      initialAnimation();

     // if (parseInt(browser.version) > 9) {
     //  console.log("good version");
     //  initialAnimation();
     // } else {
     //  alert("not support browser, redirect to old version, please use chrome to see this website");
     //  window.location.replace("./old");
     // }
    }

    checkBrowser();
});
/*
For visualization
*/
var width = 960,
    height = 550,
    root;

var force = d3.layout.force()
    .linkDistance(120)
    .charge(-1200)
    .size([width, height]);

var svg = d3.select("#vis").append("svg")
    .attr("width", width)
    .attr("height", height)


var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

function init() {
  d3.json("./data.json", function(json) {
    root = json;
    // root.fixed = true;
    root.x = width/2;
    root.y = height/2;
    var nodes = flatten(root);
        links = d3.layout.tree().links(nodes);

    // add image pattern
    svg.append('svg:defs').selectAll('pattern')
      .data(nodes)
      .enter().append('svg:pattern')
        .attr('id', function(d) { return d.img; })
        .attr('x',0)
        .attr('y', 0)
        .attr('width',1)
        .attr('height', 1)
          .append("image")
            .attr('x',0)
            .attr('y', 0)
            .attr('height',function(d) { return d.size; })
            .attr('width', function(d) { return d.size; })
            .attr("xlink:href", function(d) {
              return d.img;
          })
    //run it first to get the rough location of the children
    force
      .nodes(nodes)
      .links(links)
      .on('tick', function() {
        console.log('ticking...')
      })
      .start()
      .on('end', function() {
        console.log('end')
        root._children = root.children;
        root.children = null;
        force.on('tick', tick);
        force.on('end', null);
      });

      while(force.alpha() > 0.02) { 
          force.tick();
      }
      force.stop();
    update();
  });
}


function update() {
  console.log('update called')
  var nodes = flatten(root),
      links = d3.layout.tree().links(nodes);

  // Restart the force layout.
  force
      .nodes(nodes)
      .links(links)
      .start();

  // Update the links…
  link = link.data(links, function(d) { 
    return d.source.id + "-" + d.target.id; });

  // Exit any old links.
  link.exit().remove();

  // Enter any new links.
  link.enter().insert("line", ".node")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  // Update the nodes…
  node = node.data(nodes, function(d) { return d.id; });

  // Exit any old nodes.
  node.exit().remove();

  // Enter any new nodes.
  var nodeG = node.enter().append("g")
      .attr("class", "node")
      .on("click", click)
      .call(force.drag);

  var linkObjects = nodeG
      .append("a")
        .attr("data-toggle", "modal")
        .attr("data-target", function(d) {
          //can't have space in id
          return "#" + d.name.replace(/\+|\s/g, "_");
        })
        .on("mouseover", function(d) {
          d3.select(this)
            .select(".background-circle")
              .transition()
              .duration(300)
              .style("stroke-width", 5);
        })
        .on("mouseout", function(d) {
          d3.select(this)
            .select(".background-circle")
              .transition()
              .duration(300)
              .style("stroke-width", 2);
        });
  //append background-color...I know it is weird
  linkObjects
        .append("circle")
          .attr("class", "background-circle")
          .style("stroke", function(d) {
            return d.keyProject ? keyShadowColor : shadowColor;
          })
          .style("stroke-opacity", .6)
          .style("stroke-width", 2)
          .attr("cx", function(d) { return 0 })
          .attr("cy", function(d) { return 0})
          .attr("r", 0)
          .transition()
          .duration(500)
          .attr("r", function(d) { return d.size / 2 + 1; })
          .attr("fill", "white")
  //append image
  linkObjects
        .append("circle")
          .attr("cx", function(d) { return 0 })
          .attr("cy", function(d) { return 0})
          .attr("r", 0)
          .transition()
          .duration(500)
          .style("stroke", "none")
          .attr("r", function(d) { return d.size / 2; })
          .attr("fill", function(d) {
            return "url(#" + d.img + ")"
          })


  
  // Append the name and description
  nodeG.append("text")
      .attr("class", "nodename")
      .attr("x", function(d) {
        return -(d.name.length / 2) * 6;
      })
      .attr("y", function(d) {
        return d.size / 2 + 15;
      })
      .text(function(d) { return d.name; })
      .style("stroke", "none")
      .style("font-weight", 400)
      .style("fill", titleColor);

}

function tick() {
  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });


}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}

// Toggle children on click.
function click(d) {
  if (!d3.event.defaultPrevented) {
    if (!("_children" in d) && !("children" in d)) {
      console.log('this is a leaf', d.name.split(" ").join("_"));
      return;
    }
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update();
  }
}

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [], i = 0;
  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }
  recurse(root);
  return nodes;
}

function flatten(root) {
  var nodes = [], id = 0;
  var stack = [];
  // root.charge = -4000;
  stack.push(root);
  while(stack.length > 0) {
    var curr = stack.pop();
    if (curr.children) {
      for (var i = curr.children.length - 1; i >=0; i--) {
        stack.push(curr.children[i]);
      }
    }
    curr.id = ++id;
    // if (!curr.charge) {
    //   curr.charge = -1000;
    // }
    nodes.unshift(curr);
  }
  return nodes;
}