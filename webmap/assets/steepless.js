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

var App = React.createClass({displayName: "App",
	getInitialState: function(){
		return {
			start: '',
			end: '',
			routes: null,
			distanceUnit: localStorage['mapApp:distanceUnit'] || 'km',
			yourLocation: localStorage['mapApp:yourLocation'] || 'null',
			travelMode: 'walking'
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

		var origin = decodeURIComponent(locations[1]);
		// var origin = locations[1];

		var destination = decodeURIComponent(locations[2]);
		

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
		if (origin == "your location") {
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
					start: "Gatech, ATL",
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
			React.createElement("div", {id: "rootApp"}, 
				React.createElement("header", null, 
					React.createElement("h1", null, React.createElement(Icon, {type: "pedestrian", width: "50", height: "50"}), "Find My Way")
				), 
				React.createElement(Map, null), 
				React.createElement(RouteForm, {start: this.state.start, end: this.state.end, units: units, travelMode: travelMode, onUnitChange: this.handleUnitChange, onTravelModeChange: this.handleTravelModeChange})
			)
		);
	}
});

var Icon = React.createClass({displayName: "Icon",
	render: function(){
		var type = this.props.type;
		var title = this.props.title;
		return (
			React.createElement("svg", {title: title, className: "icon", dangerouslySetInnerHTML: {__html: '<use xlink:href="assets/icons.svg#icon-' + type + '"></use>'}, width: this.props.width, height: this.props.height})
		);
	}
});

var Map = React.createClass({displayName: "Map",
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
			React.createElement("div", {id: "map-canvas"})
		);
	}
});


var RouteForm = React.createClass({displayName: "RouteForm",
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
		location.hash = travelMode + '/' + start + '/' + end;
		// location.hash = travelMode + '/' + encodedStart + '/' + encodedEnd;
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
			React.createElement("form", {id: "directions-form", onSubmit: this.handleSubmit}, 
				React.createElement("div", {className: "travel-option"}, 
						React.createElement("select", {ref: "travelMode", onChange: this.handleTravelModeChange}, 
							React.createElement("option", {value: "walking"}, "Walking"), 
							React.createElement("option", {value: "driving"}, "Driving"), 
							React.createElement("option", {value: "bicycling"}, "Bicycling")
						)
				), 
				React.createElement("div", {className: "address"}, 
				React.createElement("div", {className: "field-section"}, 
					React.createElement("input", {ref: "start", id: "directions-start", placeholder: "Start", required: true})
				), 
				React.createElement("a", {href: "#", id: "flip-direction", onClick: this.handleFlip, title: "Flip origin and destination", tabIndex: "-1"}, React.createElement(Icon, {type: "arrow-right", width: "60", height: "60"})), 
				React.createElement("div", {className: "field-section"}, 
					React.createElement("input", {ref: "end", id: "directions-end", placeholder: "Destination", required: true})
				)
				), 
				React.createElement("div", {className: "form-footer"}, 
					React.createElement("button", null, "Go")
				)
			)
		);
	}
});


React.renderComponent(
	React.createElement(App, null),
	document.getElementById('app')
);
