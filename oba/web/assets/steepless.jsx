var getLocation = function(success, error) {
	if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error, {timeout: 10000});
	} else {
		alert("no support html5 geolocation function.");
		return;
	}
}
//summary
var mapApp = {
	directionsService: new google.maps.DirectionsService(),
	directionsRenderer: new google.maps.DirectionsRenderer(),
	elevationService: new google.maps.ElevationService(),
	longestDistance: 0,
	highestElevation: 0,
	lowestElevation: Infinity,
	chartWidth: 400,
	chartBarWidth: 2,
	getLocation : getLocation,
	yourLocationStart: null,
	yourLocationEnd: null,
	presetEnd: null
};
//bicycling

var App = React.createClass({
	getInitialState: function(){
		return {
			start: '',
			end: '',
			routes: null,
			distanceUnit: localStorage['mapApp:distanceUnit'] || 'km',
			heightUnit: localStorage['mapApp:heightUnit'] || 'm',
			travelMode: 'transit'
		};
	},
	componentDidMount: function(){
		console.log("From the app: the app componentdidmount called");
		this.hashChange();
		var self = this;
		window.onhashchange = function(){
			console.log("window detect a hash change event");
			self.hashChange();
		};
	},
	componentDidUpdate: function(){
		localStorage['mapApp:distanceUnit'] = this.state.distanceUnit;
		localStorage['mapApp:heightUnit'] = this.state.heightUnit;
	},
	hashChange: function(){
		var hash = location.hash.slice(1);
		if (!hash) return;

		var locations = hash.split('/');
		console.log("hash received ", hash);
		var travelMode = decodeURIComponent(locations[0]);
		// var travelMode = locations[0];

		var origin = decodeURIComponent(locations[1]).toUpperCase();
		// var origin = locations[1];

		var destination = decodeURIComponent(locations[2]).toUpperCase();
		console.log("testing");
		// check if use current position
		if (origin == "YOUR LOCATION" || destination == "YOUR LOCATION") {
			console.log("Use HTML5 to get the location of the users");
			var that = this;
			mapApp.getLocation(function(position) {
				// console.log(position);
				var googlePosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				mapApp.yourLocationStart = (origin == "YOUR LOCATION") ? googlePosition : null;
				mapApp.yourLocationEnd = (destination == "YOUR LOCATION") ? googlePosition : null;
				
				that.setState({
					travelMode: travelMode,
					start: origin,
					end: destination
				});
				that.getRoutes();
			}, function(error) {
				console.log("error happened!");
				mapApp.yourLocationStart = null;
				mapApp.yourLocationEnd = null;
				that.setState({
					travelMode: travelMode,
					start: "GATECH, ATL",
					end: destination
				});
				that.getRoutes();
			});
		} else {
			console.log("normal case");
			// clean the preset location
			mapApp.yourLocationStart = null;
			mapApp.yourLocationEnd = null;


			this.setState({
				travelMode: travelMode,
				start: origin,
				end: destination,
			});
			this.getRoutes();
		}
	},
	getRoutes: function(){
		var self = this;
		var state = this.state;

		mapApp.directionsService.route({
			origin: mapApp.yourLocationStart ? mapApp.yourLocationStart : state.start,
			destination: mapApp.yourLocationEnd ? mapApp.yourLocationEnd : state.end,
			travelMode: google.maps.TravelMode[this.state.travelMode.toUpperCase()],
			provideRouteAlternatives: true,
			// unitSystem: google.maps.UnitSystem.METRIC
		}, function(response, status){
			if (status == google.maps.DirectionsStatus.OK) {
				var routes = response.routes;
				var updateRoutes;
				console.log("===routes get====", routes);
				if (self.state.travelMode == "transit") {
					// console.log(routes.shift());
					routes.shift();

					updateRoutes = routes.map(function(route, i){
							var summary = route.legs[0].steps.reduce(function(prev, curr) {
								return prev + curr.instructions;
							}, "");
							route.summary = summary;
							return {
								route: route,
								selected: (i == 0)
							};
					});
				} else {
					updateRoutes = routes.map(function(route, i){
							return {
								route: route,
								selected: (i == 0)
							};
					});
				}



				self.setState({
					routes: updateRoutes
				});
				mapApp.directionsRenderer.setDirections(response);
			} else {
				console.log("did not get route");
				self.setState({
					routes: []
				});
			}
			// if (status == google.maps.DirectionsStatus.OK) {
			// 	var routes = response.routes;
			// 	var longestDistance = 0;
			// 	routes.forEach(function(route){
			// 		var distance = route.legs[0].distance.value;
			// 		if (distance > longestDistance) longestDistance = distance;
			// 	});
			// 	mapApp.longestDistance = longestDistance;
			// 	self.setState({
			// 		routes: routes.map(function(route, i){
			// 			return {
			// 				route: route,
			// 				selected: (i == 0)
			// 			};
			// 		})
			// 	});

			// 	mapApp.directionsRenderer.setDirections(response);

			// 	self.getElevations();
			// } else {
			// 	self.setState({
			// 		routes: []
			// 	});
			// }
		});
	},
	// getElevations: function(){
	// 	var self = this;
	// 	var routes = this.state.routes;

	// 	var q = queue();

	// 	routes.forEach(function(data, i){
	// 		q.defer(function(done){
	// 			var route = data.route;
	// 			var path = route.overview_path;
	// 			var distance = route.legs[0].distance.value;
	// 			var samples = Math.round(distance/mapApp.longestDistance * (mapApp.chartWidth/mapApp.chartBarWidth));
	// 			mapApp.elevationService.getElevationAlongPath({
	// 				path: path,
	// 				samples: samples
	// 			}, function(result, status){
	// 				if (status == google.maps.ElevationStatus.OK){
	// 					done(null, {
	// 						data: data,
	// 						elevations: result
	// 					});
	// 				} else {
	// 					done(status);
	// 				}
	// 			});
	// 		});
	// 	});


	// 	q.awaitAll(function(error, results){
	// 		if (error){
	// 			console.log(error);
	// 			return;
	// 		}

	// 		var highestElevation = 0, lowestElevation = Infinity;

	// 		results.forEach(function(result, i){
	// 			var elevations = result.elevations;
	// 			var prevElevation = elevations[0].elevation;
	// 			var rise = 0, drop = 0;

	// 			elevations.forEach(function(r){
	// 				var elevation = r.elevation;
	// 				if (elevation > prevElevation) rise += elevation - prevElevation;
	// 				if (elevation < prevElevation) drop += prevElevation - elevation;
	// 				prevElevation = elevation;

	// 				if (elevation > highestElevation) highestElevation = elevation;
	// 				if (elevation < lowestElevation) lowestElevation = elevation;
	// 			});

	// 			result.data.stats = {
	// 				rise: rise,
	// 				drop: drop
	// 			};
	// 			result.data.elevations = elevations;
	// 		});

	// 		mapApp.highestElevation = highestElevation;
	// 		mapApp.lowestElevation = lowestElevation;
	// 		self.setState({
	// 			routes: routes
	// 		});
	// 	});
	// },
	handleRouteClick: function(index){
		this.state.routes.forEach(function(d, i){
			d.selected = (index == i);
		});
		this.setState(this.state);

		mapApp.directionsRenderer.setRouteIndex(index);
	},
	handleUnitChange: function(units){
		this.setState(units);
	},
	handleTravelModeChange: function(travelMode){
		this.setState({
			travelMode: travelMode
		});
	},
	render: function(){
		var units = {
			distance: this.state.distanceUnit,
			height: this.state.heightUnit
		};
		var travelMode = this.state.travelMode;
		return (
			<div>
				<Map />
				<div id="sidebar">
					<MyHeader />
					<RouteForm start={this.state.start} end={this.state.end} units={units} travelMode={travelMode} onUnitChange={this.handleUnitChange} onTravelModeChange={this.handleTravelModeChange} />
					<RouteList data={this.state.routes} travelMode={travelMode} units={units} onRouteClick={this.handleRouteClick} />
				</div>
			</div>
		);
	}
});

var Icon = React.createClass({
	render: function(){
		var type = this.props.type;
		var title = this.props.title;
		return (
			<svg title={title} className="icon" dangerouslySetInnerHTML={{__html: '<use xlink:href="assets/icons.svg#icon-' + type + '"></use>'}} width={this.props.width} height={this.props.height}></svg>
		);
	}
});

var MyHeader = React.createClass({
	getURL: function() {
  		window.prompt("Copy to clipboard: Ctrl+C/Cmd-C, Enter", window.location.href);
	},
	render: function() {
		return (
			<header>
				<h1><MyIcon type="directions_subway"></MyIcon>OneBusAway Mobile</h1>
				<button onClick={this.getURL}>Event Planner?</button>
			</header>
		)
	}
});


var MyIcon = React.createClass({
	render: function(){
		var type = this.props.type;
		return (
			<i className="material-icons icon">{type}</i>
		);
	}
});

var Map = React.createClass({
	getDefaultProps: function(){
		return {
			map: {
				center: new google.maps.LatLng(37.7577, -122.4376),
				zoom: 12,
				disableDefaultUI: true
			}
		};
	},
	statics: {
		pinpointMarker: new google.maps.Marker({
			visible: false,
			clickable: false,
			zIndex: 1000
		}),
		showPinpointMarker: function(location){
			this.pinpointMarker.setPosition(location);
			this.pinpointMarker.setVisible(true);
		},
		hidePinpointMarker: function(){
			this.pinpointMarker.setVisible(false);
		}
	},
	componentDidMount: function(){
		var node = this.getDOMNode();
		var map = new google.maps.Map(node, this.props.map);
		Map.pinpointMarker.setMap(map);

		mapApp.directionsRenderer.setMap(map);
	},
	render: function(){
		return (
			<div id="map-canvas"></div>
		);
	}
});

// var Chart = React.createClass({
// 	handleBarMouseEnter: function(index){
// 		this.props.onBarMouseEnter(index);
// 	},
// 	handleBarMouseLeave: function(){
// 		this.props.onBarMouseLeave();
// 	},
// 	render: function(){
// 		var self = this;
// 		var props = this.props;
// 		var chartStyle = {
// 			width: props.width,
// 			height: 0 // initially zero height
// 		};
// 		var bars = '';
// 		if (props.data){
// 			bars = props.data.map(function(d, i){
// 				var style = {
// 					borderBottomWidth: props.height * d.value / props.domain[1]
// 				};
// 				var key = i + '-' + d.value;
// 				return (
// 					<div style={style} key={key} onMouseEnter={self.handleBarMouseEnter.bind(self, i)} onMouseLeave={self.handleBarMouseLeave}><span>{d.title}</span></div>
// 				);
// 			});
// 			chartStyle.height = props.height; // then grow the height, CSS transition applied here
// 		}
// 		return (
// 			<div className="chart" style={chartStyle}>
// 				{bars}
// 			</div>
// 		)
// 	}
// });

var RouteForm = React.createClass({
	updateLocationHash: function(travelMode, start, end){
		if (!travelMode) travelMode = this.props.travelMode;
		if (!start) start = this.props.start;
		if (!end) end = this.props.end;
		if (!start || !end) return;
		location.hash = travelMode + '/' + encodeURIComponent(start) + '/' + encodeURIComponent(end);
	},
	handleSubmit: function(){
		var travelMode = this.refs.travelMode.getDOMNode().value;
		var start = this.refs.start.getDOMNode().value.trim();
		var end = this.refs.end.getDOMNode().value.trim();
		this.updateLocationHash(travelMode, start, end);
	},
	iconMap: {
		transit: 'directions_subway',
		driving: 'directions_car',
		bicycling: 'directions_bike'
	},
	componentDidMount: function(){
		var startNode = this.refs.start.getDOMNode();
		var endNode = this.refs.end.getDOMNode();
		var start = startNode.value.trim();
		var end = endNode.value.trim();

		if (start && end){
			if (this.props.start) startNode.value = this.props.start;
			if (this.props.end) endNode.value = this.props.end;
		}

		new google.maps.places.Autocomplete(startNode);
		new google.maps.places.Autocomplete(endNode);
	},
	componentWillReceiveProps: function(){
		if (this.props.travelMode) this.refs.travelMode.getDOMNode().value = this.props.travelMode;
		if (this.props.start) this.refs.start.getDOMNode().value = this.props.start;
		if (this.props.end) this.refs.end.getDOMNode().value = this.props.end;
	},
	handleTravelModeChange: function(){
		var travelMode = this.refs.travelMode.getDOMNode().value;
		this.updateLocationHash(travelMode);
	},
	handleFlip: function(e){
		e.preventDefault();
		var start = this.refs.start.getDOMNode().value.trim();
		var end = this.refs.end.getDOMNode().value.trim();
		this.updateLocationHash(null, end, start);
	},
	handleDistanceChange: function(){
		var unit = this.refs.distanceSelect.getDOMNode().value;
		this.props.onUnitChange({
			distanceUnit: unit
		});
	},
	handleHeightChange: function(){
		var unit = this.refs.heightSelect.getDOMNode().value;
		this.props.onUnitChange({
			heightUnit: unit
		});
	},
	render: function(){
		var units = this.props.units;
		var iconType = this.iconMap[this.props.travelMode];

		return (
			<form id="directions-form" onSubmit={this.handleSubmit}>
				<div className="field-section">
					<label>
					<div className="travelmode-selection">
						<MyIcon type={iconType} />
						<select ref="travelMode" onChange={this.handleTravelModeChange}>
							<option value="transit">Transit</option>
							<option value="driving">Driving</option>
							<option value="bicycling">Bicycling</option>
						</select>
					</div>
						 from
					</label>
					<input ref="start" id="directions-start" placeholder="Start" required />
				</div>
				<a href="#" id="flip-direction" onClick={this.handleFlip} title="Flip origin and destination" tabIndex="-1"><Icon type="arrow-right" width="14" height="14"></Icon></a>
				<div className="field-section">
					<label htmlFor="directions-end">To</label>
					<input ref="end" id="directions-end" placeholder="Destination" required />
				</div>
				<div className="form-footer">
					<div className="options">
						<select ref="timeMode">
							<option value="leaveNow">Leave Now</option>
							<option value="arrivedBy">Arrived By</option>
							<option value="departureAt">Departure At</option>
						</select>
					</div>
					<button>Go</button>
				</div>
			</form>
		);
	}
});

var RouteList = React.createClass({
	handleClick: function(index){
		this.props.onRouteClick(index);
	},
	handlePinpoint: function(data){
		this.props.onSetPinpoint(data);
	},
	render: function(){
		var self = this;
		var data = this.props.data;
		console.log(data);
		if (data && data.length){
			var routes = this.props.data.map(function(d, i){
				var key = i + '' + d.route.bounds.toString();
				return (
					<li key={key} className={d.selected ? 'selected' : ''} onClick={self.handleClick.bind(self, i)}>
						<Route data={d} units={self.props.units} travelMode={self.props.travelMode} onSetPinpoint={self.handlePinpoint} />
					</li>
				);
			})
			return (
				<div id="routes-container">
					<ul id="routes-list">
						{routes}
					</ul>
				</div>
			);
		} else if (!!data){
			return (
				<div id="routes-container">
					<p>Oops, there are no routes found.</p>
				</div>
			);
		} else {
			return (
				<div id="routes-container">
					<p>Begin by entering the Start and Destination locations above.</p>
					<p>Try an example: <a href="#transit/your location/piedmont park, atl">Transit from "Your Location" to "Piedmont Park"</a></p>
				</div>
			)
		}
	}
});

var Route = React.createClass({
	handleBarHover: function(index){
		// if (index){
		// 	var data = this.props.data.elevations[index];
		// 	Map.showPinpointMarker(data.location);
		// } else {
		// 	Map.hidePinpointMarker();
		// }
	},
	iconMap: {
		transit: 'directions_subway',
		driving: 'directions_car',
		bicycling: 'directions_bike'
	},
	gotoRealTime: function() {
		window.open("http://atlanta.onebusaway.org/where/standard/" , '_blank');
	},
	gotoMobile: function() {
		var hash = location.hash;
		console.log(hash);
		window.open(location.protocol+'//'+location.host +"/kjweb/oba/mobile" + hash , '_blank');
	},
	render: function(){
		var data = this.props.data;
		var units = this.props.units;
		var route = data.route;
		var leg = route.legs[0];
		var distance = leg.distance.value;
		var width = Math.ceil(distance/mapApp.longestDistance * mapApp.chartWidth);
		var chartWidth = {width: width};
		var stats = data.stats;
		var domain = [0, mapApp.highestElevation];

		var iconType = this.iconMap[this.props.travelMode];

		var height = Math.round((mapApp.highestElevation - mapApp.lowestElevation) / 2);
		var rise = null, drop = null, heightUnit = units.height;
		if (stats){
			var statsRise = stats.rise, statsDrop = stats.drop;
			rise = Math.round(heightUnit == 'm' ? statsRise : statsRise*3.28084) + ' ' + heightUnit;
			drop = Math.round(heightUnit == 'm' ? statsDrop : statsDrop*3.28084) + ' ' + heightUnit;
		}

		var distanceUnit = units.distance;
		var distanceVal = leg.distance.value;
		var distance = (distanceUnit == 'km' ? distanceVal/1000 : distanceVal*0.000621371).toFixed(2) + ' ' + distanceUnit;
		var riseStat = rise ? <span><Icon type="arrow-graph-up-right" width="14" height="14" title="Rise"></Icon> {rise}</span> : '';
		var dropStat = drop ? <span><Icon type="arrow-graph-down-right" width="14" height="14" title="Drop"></Icon> {drop}</span> : '';

		var elevations = data.elevations ? data.elevations.map(function(d){
			var elevation = d.elevation;
			return {
				value: elevation,
				title: Math.round(heightUnit == 'm' ? elevation : elevation*3.28084) + ' ' + heightUnit
			}
		}) : null;

		return (
			<a>
				<div className="heading">
					via {route.summary}
					<div className="smartphone" onClick={this.gotoMobile}><MyIcon type="smartphone" /> <span>Mobile</span> </div>
				</div>


				<div className="stats">{riseStat}&nbsp;&nbsp;&nbsp;{dropStat}</div>
				<div className="schedule">
					<MyIcon type="schedule"/> <span onClick={this.gotoRealTime}>Real Time</span>
				</div>
				<div className="stats">{riseStat}&nbsp;&nbsp;&nbsp;{dropStat}</div>

				<div className="metadata">{leg.duration.text}&nbsp;&nbsp;&nbsp;{distance}</div>
			</a>
		);
	}
});

React.renderComponent(
	<App />,
	document.getElementById('app')
);
