var getLocation = function(success, error) {
	if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error, {timeout: 10000});
	} else {
		alert("no support html5 geolocation function.");
		return;
	}
}

var mapApp = {
	directionsService: new google.maps.DirectionsService(),
	directionsRenderer: new google.maps.DirectionsRenderer(),
	getLocation : getLocation,
	yourLocation: null,
	presetEnd: null
};

var App = React.createClass({
	getInitialState: function(){
		return {
			start: '',
			end: '',
			routes: null,
			distanceUnit: localStorage['mapApp:distanceUnit'] || 'km',
			yourLocation: localStorage['mapApp:yourLocation'] || 'null',
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
		console.log("From the app: the app componentDidUpdate called");
		localStorage['mapApp:distanceUnit'] = this.state.distanceUnit;
	},
	hashChange: function(){
		console.log("-------hashChange function being called------");
		var hash = location.hash.slice(1);

		if (!hash) {
			console.log("empty case");
			return;
		}


		var locations = hash.split('/');
		console.log("hash received ", hash);
		var travelMode = decodeURIComponent(locations[0]);
		// var travelMode = locations[0];

		var origin = decodeURIComponent(locations[1]).toUpperCase();
		// var origin = locations[1];

		var destination = decodeURIComponent(locations[2]).toUpperCase();

		// check if use current position
		if (origin == "YOUR LOCATION") {
			console.log("Use HTML5 to get the location of the users");
			var that = this;
			mapApp.getLocation(function(position) {
				console.log(position);
				mapApp.yourLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				that.setState({
					travelMode: travelMode,
					start: origin,
					end: destination
				});
				that.getRoutes();
			}, function(error) {
				console.log("error happened!");
				mapApp.yourLocation = null;
				that.setState({
					travelMode: travelMode,
					start: "GATECH, ATL",
					end: destination
				});
				that.getRoutes();
			});
		} else {
			// clean the preset location
			mapApp.yourLocation = null;

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
			origin: mapApp.yourLocation ? mapApp.yourLocation : state.start,
			destination: mapApp.presetEnd ? mapApp.presetEnd : state.end,
			travelMode: google.maps.TravelMode[this.state.travelMode.toUpperCase()],
			provideRouteAlternatives: true,
			// unitSystem: google.maps.UnitSystem.METRIC
		}, function(response, status){
			if (status == google.maps.DirectionsStatus.OK) {
				var routes = response.routes;
				console.log("===routes get====", routes);
				if (self.state.travelMode == "transit") {
					console.log(routes.shift());
				}
				self.setState({
					routes: routes.map(function(route, i){
						return {
							route: route,
							selected: (i == 0)
						};
					})
				});
				mapApp.directionsRenderer.setDirections(response);
			} else {
				console.log("did not get route");
				self.setState({
					routes: []
				});
			}
		});
	},
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
		console.log("app render get called");
		var units = {
			distance: this.state.distanceUnit,
			height: this.state.heightUnit
		};
		var travelMode = this.state.travelMode;
		return (
			<div id="rootApp">
				<MyHeader />
				<Map />
				<RouteForm start={this.state.start} end={this.state.end} units={units} travelMode={travelMode} onUnitChange={this.handleUnitChange} onTravelModeChange={this.handleTravelModeChange} />
			</div>
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
				<button onClick={this.getURL}>Get URL</button>
			</header>
		)
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


//  le} className="icon" dangerouslySetInnerHTML={{__html: '<use xlink:href="assets/icons.svg#icon-' + type + '"></use>'}} width={this.props.width} height={this.props.height}></svg>

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
		console.log("map componentdidmount called")
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


var RouteForm = React.createClass({
	updateLocationHash: function(travelMode, start, end){
		console.log("---------rout form update location hash-----------");
		console.log("route form submit, and get the parameters from input props, then update the location with the encoded parameters");
		if (!travelMode) travelMode = this.props.travelMode;
		if (!start) start = this.props.start;
		if (!end) end = this.props.end;
		if (!start || !end) return;
		var encodedStart = encodeURIComponent(start),
			encodedEnd = encodeURIComponent(end);
		console.log("encoded", encodedStart, encodedEnd);
		// location.hash = travelMode + '/' + start + '/' + end;
		location.hash = travelMode + '/' + encodedStart + '/' + encodedEnd;
	},
	handleSubmit: function(){
		var travelMode = this.refs.travelMode.getDOMNode().value;
		var start = this.refs.start.getDOMNode().value.trim();
		var end = this.refs.end.getDOMNode().value.trim();
		console.log("---------rout form handle submit-----------");
		console.log(travelMode, start, end);

		this.updateLocationHash(travelMode, start, end);
	},
	componentDidMount: function(){
		console.log("Route form componentdidmount called");
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
		return (
			<form id="directions-form" onSubmit={this.handleSubmit}>
				<div className="travel-option">
						<select ref="travelMode" onChange={this.handleTravelModeChange}>
							<option value="transit">Transit</option>
							<option value="driving">Driving</option>
							<option value="walking">walking</option>
						</select>
				</div>
				<div className="address">
				<div className="field-section">
					<input ref="start" id="directions-start" placeholder="Start" required />
				</div>
				<a href="#" id="flip-direction" onClick={this.handleFlip} title="Flip origin and destination" tabIndex="-1"><Icon type="arrow-right" width="20" height="20"></Icon></a>
				<div className="field-section">
					<input ref="end" id="directions-end" placeholder="Destination" required />
				</div>
				</div>
				<div className="form-footer">
					<button>Go</button>
				</div>
			</form>
		);
	}
});


React.renderComponent(
	<App />,
	document.getElementById('app')
);
