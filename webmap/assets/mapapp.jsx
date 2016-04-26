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
	presetEnd: null,
	presetLocations: {
		EBCHS: {
			lat: 33.755369,
			lng: -84.374225
		},
		SAWK : {
			lat: 33.755618, 
			lng: -84.374113
		},
		F15 : {
			lat: 33.755562,
			lng: -84.374547
		},
		CBF : {
			lat: 33.755557,
			lng: -84.375164
		},
		HFH : {
			lat: 33.755536,
			lng: -84.375687
		},
		WSBC : {
			lat: 33.755442,
			lng: -84.375957
		},
		F12 : {
			lat: 33.755595,
			lng: -84376801
		},
		F13 : {
			lat: 33.755376,
			lng: -84.376790
		},
		SAD : {
			lat: 33.755464,
			lng: -84.377686
		},
		ODDFEL : {
			lat: 33.755608,
			lng: -84.380091
		},
		F6 : {
			lat: 33.755794,
			lng: -84.381962
		},
		SAW : {
			lat: 33.755670,
			lng: -84.383041
		},
		F4 : {
			lat: 33.755440,
			lng: -84.383559
		},
		F2 : {
			lat: 33.755447,
			lng: -84.384962
		},
		F1 : {
			lat: 33.755632,
			lng: -84387775
		}
	}
};

var App = React.createClass({
	getInitialState: function(){
		return {
			start: '',
			end: '',
			routes: null,
			distanceUnit: localStorage['mapApp:distanceUnit'] || 'km',
			yourLocation: localStorage['mapApp:yourLocation'] || 'null',
			travelMode: 'walking',
			showAll: false,
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
	toShowAll: function() {
		if (this.state.showAll) {
			Map.hidePinpointMarker();
			this.setState({showAll: false});
		} else {
			Map.showPinpointMarker();
			this.setState({showAll: true});
		}
	},
	hashChange: function(){
		console.log("-------hashChange function being called------");
		var hash = location.hash.slice(1);

		if (!hash) {
			console.log("empty case");
			return;
		}


		var locations = hash.split('/');

		// location.hash = travelMode + '/' + encodedStart + '/' + encodedEnd;

		console.log("hash received ", hash);
		var travelMode = decodeURIComponent(locations[0]);
		// var travelMode = locations[0];

		var origin = decodeURIComponent(locations[1]).toUpperCase();
		// var origin = locations[1];

		var destination = decodeURIComponent(locations[2]).toUpperCase();
		

		// check if use default destination
		if (typeof mapApp.presetLocations[destination] !== 'undefined') {
			var latlng = mapApp.presetLocations[destination];
			console.log(latlng);
			console.log(typeof mapApp.presetLocations[destination]);

			mapApp.presetEnd =  new google.maps.LatLng(latlng.lat, latlng.lng);
		} else {
			mapApp.presetEnd = null;
		}

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
			unitSystem: google.maps.UnitSystem.METRIC
		}, function(response, status){
			if (status == google.maps.DirectionsStatus.OK) {
				var routes = response.routes;
				console.log("===routes get====", routes);
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
				<MyHeader showAll={this.state.showAll} toShowAll={this.toShowAll}/>
				<Map />
				<RouteForm start={this.state.start} end={this.state.end} units={units} travelMode={travelMode} onUnitChange={this.handleUnitChange} onTravelModeChange={this.handleTravelModeChange} />
			</div>
		);
	}
});

var MyHeader = React.createClass({
	render: function() {
		return (
			<header>
				<h1><Icon type="pedestrian" width="36" height="36"></Icon>Find My Way</h1>
				<input type="button" onClick={this.props.toShowAll} ref="button" value={this.props.showAll ? "Hide All Boards" : "Show All Boards"}/>
			</header>
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

var Map = React.createClass({
	getDefaultProps: function(){
		return {
			map: {
				center: new google.maps.LatLng(33.775787, -84.396306),
				zoom: 12,
				disableDefaultUI: true
			}
		};
	},
	statics: {
		pinpointMarkers: Object.keys(mapApp.presetLocations).map(function(key) {
				var place = mapApp.presetLocations[key];
				var marker = new google.maps.Marker({
					visible: false,
					clickable: true,
					zIndex: 1000
				});
				marker.setPosition(new google.maps.LatLng(place.lat, place.lng));
				marker.addListener('click', function() {
					console.log("marker being clicked");
					var hash = location.hash.slice(1);
					var locations = hash.split('/');
					location.hash = locations[0] + '/' + locations[1] + '/' + key;
  				});
				return marker;
		}),
		showPinpointMarker: function(){
			this.pinpointMarkers.forEach(function(marker) {
				marker.setVisible(true);
			});
		},
		hidePinpointMarker: function(){
			this.pinpointMarkers.forEach(function(marker) {
				marker.setVisible(false);
			});
		}
	},
	componentDidMount: function(){
		console.log("map componentdidmount called")
		var node = this.getDOMNode();
		var map = new google.maps.Map(node, this.props.map);

		Map.pinpointMarkers.forEach(function(marker) {
			marker.setMap(map);
		})

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
							<option value="walking">Walking</option>
							<option value="driving">Driving</option>
							<option value="bicycling">Bicycling</option>
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
