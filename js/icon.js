var myIcon_frame_bg_color = "#545454";

var icon_div = d3.select("#icon-div");

function fading() {
  d3.select('#logo')
    .style('fill', '#ffffff')
    .transition()
    .duration(1800)
    .style({
      "fill": "#ffffff",
      "stroke-width": 0,
      "stroke": "#ffffff"
    });

  // d3.select('#frame')
  //   .transition()
  //   .duration(2000)
  //   .style('opacity', 0);

  d3.select('#icon-svg')
    .transition()
    .duration(1800)
    .style({
      "background": myIcon_frame_bg_color,
    });

  d3.select('#icon-div')
    .transition()
    .duration(1000)
    .style({
      "border-radius": "22%"
    }).each('end', function() {
      d3.select(this)
        .style({
          "-webkit-box-shadow": "0 5px 10px rgba(0,0,0,.05),0 5px 5px rgba(0,0,0,.08),0 7px 10px rgba(0,0,0,.09),0 22px 22px rgba(0,0,0,.05)",
          "-moz-box-shadow": "0 5px 10px rgba(0,0,0,.05),0 5px 5px rgba(0,0,0,.08),0 7px 10px rgba(0,0,0,.09),0 22px 22px rgba(0,0,0,.05)",
          "box-shadow": "0 5px 10px rgba(0,0,0,.05),0 5px 5px rgba(0,0,0,.08),0 7px 10px rgba(0,0,0,.09),0 22px 22px rgba(0,0,0,.05)"
        })
      // after fading of the icon-div, show #iconDescription
      d3.select("#iconDescription")
        .transition()
        .duration(1500)
        .style("opacity", 1)
          .each('end', function() {
            // after #iconDescription shown, show #my-intro
            d3.select("#my-intro")
              .transition()
              .duration(500)
              .style('opacity', 1)
            d3.select("#exploreButton")
              .transition()
              .duration(500)
              .style('opacity', 1)
          })
    });
}


//initial animation

function initialAnimation() {
  d3.select('#icon-div')
    .transition()
    .duration(800)
    .ease('back')
    .style({
      'top': '0'
    })
    .transition()
    .duration(400)
    .ease('linear')
    .style({
      'width': '180px',
      'height': '180px',
      'border-radius': '0%',
      'border-color': 'white'
    })
    .each('end', function() {
      //when the icon_div popup
      //start drawing of #frame and #logo
      d3.select(this).select('#frame')
        .transition()
        .duration(2000)
        .style('stroke-dashoffset', 0)

      d3.select(this).select('#logo')
        .transition()
        .duration(1800)
        .delay(1000)
        .style('stroke-dashoffset', 0)
        .each('end', function() {
          //after #logo finished, start fading
          fading();
        });
    })
}

