var directionsService;
var travelTimeDriving;

var getUberPrices = firebase.functions().httpsCallable('getUberPrices');
var getUberTimes = firebase.functions().httpsCallable('getUberTimes');

var getLyftPrices = firebase.functions().httpsCallable('getLyftPrices');
var getLyftTimes = firebase.functions().httpsCallable('getLyftTimes');
var uberReady = false, uberRides = [], lyftReady = false, lyftRides = [];

var start, end;

  function comparePrice(a,b) {
    comparisonPriceA = (a.highEstimate+a.lowEstimate)/2;
    comparisonPriceB = (b.highEstimate+b.lowEstimate)/2;
    if(comparisonPriceA < comparisonPriceB)
      return -1;
    else if(comparisonPriceA > comparisonPriceB)
      return 1;
    else
      return 0;
  }

  function ready() {
    if(!uberReady || !lyftReady) {
      return;
    }

    var rides = uberRides.concat(lyftRides);
    rides.sort(comparePrice);

  directionsService.route({
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.TRANSIT
  }, function(response, status) {
    var data = undefined;
    if(status == "OK") {
      var description = "";
      var travelTime = 0;
      for (var i = 0; i < response.routes[0].legs[0].steps.length; i++) {
        travelTime+=response.routes[0].legs[0].steps[i].duration.value;
        if(response.routes[0].legs[0].steps[i].travel_mode == "TRANSIT")
          description += "<img src="+((response.routes[0].legs[0].steps[i].transit.line.vehicle.local_icon==undefined)?response.routes[0].legs[0].steps[i].transit.line.vehicle.icon:response.routes[0].legs[0].steps[i].transit.line.vehicle.local_icon)+" height=16px width=16px></img> "+((response.routes[0].legs[0].steps[i].transit.line.short_name==undefined)?response.routes[0].legs[0].steps[i].transit.line.name:response.routes[0].legs[0].steps[i].transit.line.short_name)+((i<response.routes[0].legs[0].steps.length-2)?" <i class=\"fa fa-caret-right\" aria-hidden=\"true\"></i> ":"");
      }
      rides.push({
        name: description,
        highEstimate: 0,
        lowEstimate: 0,
        surge: "",
        companyLogo: "",
        surgeText: "",
        estimate:"",
        service: "Transit",
        product_id: "Transit",
        orderLink: 'https://www.google.com/maps/dir/'+start.lat+','+start.lng+'/'+end.lat+','+end.lng+"/data=!4m2!4m1!3e3",
        eta: ((travelTime/60/60>=1)?""+parseInt(travelTime/60/60)+" hours and ":"")+parseInt(travelTime/60%60)+" minutes "+((travelTimeDriving==undefined)?"":"compared to "+travelTimeDriving+" on the road.")
      });
    }
    tablehtml = "<tr><th>Ride</th><th>"/*surge*/+"</th><th>Cost</th><th>ETA</th><th></th></tr>";
    for (var i = 0; i < rides.length; i++) {
      tablehtml+='<tr><td>'+rides[i].companyLogo+' '+rides[i].name+'</td><td>'+(rides[i].surge!=1?' '+rides[i].surgeText+' '+rides[i].surge:'')+'</td><td>'+rides[i].estimate+'</td><td>'+rides[i].eta+'</td><td><a href='+rides[i].orderLink+'><button type="button" class="btn btn-default">Go!</button></a></td></tr>'
    }
    $('#prices').html(tablehtml);
    $('#lastUpdated').html("Last Updated: "+(new Date()).toLocaleString());
  });
  $("body").removeClass("grey");
}
function initMap() {
  // Create a map object and specify the DOM element for display.
  var map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      mapTypeIds: [
        google.maps.MapTypeId.ROADMAP,
        google.maps.MapTypeId.HYBRID
      ]
    },
    scrollwheel: true,
    zoom: 13
  });

  // var traffic = new google.maps.TrafficLayer({
  //   map: map,
  // });


  var originSearchBox = new google.maps.places.SearchBox(document.getElementById('startSearch'));
  var destinationSearchBox = new google.maps.places.SearchBox(document.getElementById('destSearch'));

  var destMarker, originMarker;
  originMarker = new google.maps.Marker({
    map:map,
    draggable: true,
    title: "End"
  });
  destMarker = new google.maps.Marker({
    map:map,
    draggable: true,
    title: "End"
  });
  navigator.geolocation.getCurrentPosition(function(location) {
    var currLoc = {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    };
    map.setCenter(currLoc);
    map.setZoom(15);
    originMarker.setPosition(currLoc);
  });
  google.maps.event.addListener(map, "click", function(event) {
    destMarker.setPosition(event.latLng);
    update();
  });
  destinationSearchBox.addListener('places_changed', function() {
    var places = destinationSearchBox.getPlaces();

    if (places.length == 0)
      return;

    places.forEach(function(place){
      destMarker.setPosition(place.geometry.location);
    });
    updateBounds();
    update();
  });
  originSearchBox.addListener('places_changed', function() {
    var places = originSearchBox.getPlaces();

    if (places.length == 0)
      return;

    places.forEach(function(place){
      originMarker.setPosition(place.geometry.location);
    });
    updateBounds();
    update();
  });
  map.addListener('bounds_changed', function(){
    destinationSearchBox.setBounds(map.getBounds());
  });
  destMarker.addListener('mouseup', function() {
    $('#destSearch').val("");
    update();
  });
  originMarker.addListener('mouseup', function() {
    $('#startSearch').val("");
    update();
  });


  directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer ({
    map: map,
    suppressMarkers: true,
    suppressInfoWindows: true
  });
  directionsDisplay.setMap(map);

  function update() {
    if(originMarker.position != undefined && destMarker.position != undefined) {
      $("body").addClass("grey");
      setTimeout(function(){
        calculateAndDisplayRoute(originMarker.position, destMarker.position);
        calculateRides(originMarker.position.lat(), originMarker.position.lng(), destMarker.position.lat(), destMarker.position.lng());
      },100);
    }
  }

  function calculateAndDisplayRoute(start, end) {
    directionsService.route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
      travelTimeDriving = ""+response.routes[0].legs[0].duration.text;
      $('#tripTime').html("The trip will take "+response.routes[0].legs[0].duration.text+" via "+response.routes[0].summary);
      if (status === google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
      }
    });
  }

  function updateBounds () {
    var bounds = new google.maps.LatLngBounds();
    if(originMarker.position != undefined)
      bounds.extend(originMarker.position);
    if(destMarker.position != undefined)
      bounds.extend(destMarker.position);
    map.fitBounds(bounds);
    if(map.getZoom()>15)
      map.setZoom(15);
  }

  setInterval(function() {
    if(originMarker.position != undefined && destMarker.position != undefined) {
      console.log("Recalculating");
      calculateRides(originMarker.position.lat(), originMarker.position.lng(), destMarker.position.lat(), destMarker.position.lng());
    }
  },60000);

  $("#refresh").click(function(){
    $("body").addClass("grey");
    setTimeout(function(){
      if(originMarker.position != undefined && destMarker.position != undefined) {
        calculateRides(originMarker.position.lat(), originMarker.position.lng(), destMarker.position.lat(), destMarker.position.lng());
      }
    },100);
  });
}

function calculateRides (startLat, startLng, endLat, endLng) {

  start = {
    lat:startLat,
    lng:startLng
  }
  end = {
    lat:endLat,
    lng:endLng
  }

  uberReady = false;
  uberRides = [];
  getUberPrices({ startLat: startLat,
   startLng: startLng,
   endLat: endLat,
   endLng: endLng
  }).then(function(result) {
    var output = JSON.parse(result.data);
    // Read result of the Cloud Function.
    for (var i = 0; i < output.prices.length; i++) {
      //Add prices for uber
      uberRides.push(
        {
          name: output.prices[i].localized_display_name,
          highEstimate: output.prices[i].high_estimate,
          lowEstimate: output.prices[i].low_estimate,
          surge: output.prices[i].surge_multiplier,
          companyLogo: "<img src=uberAssets/RIDESAPIICON/SVG/uber_rides_api_icon.svg height=16px width=16px>",
          surgeText: "<img src=uberAssets/UBERSURGEICON/PNGs/1x/Uber_Surge_Icon_16px.png>",
          estimate: output.prices[i].estimate,
          service: "Uber",
          product_id: output.prices[i].product_id,
          orderLink: 'uber://?action=setPickup&pickup[latitude]='+startLat+'&pickup[longitude]='+startLng+'&dropoff[latitude]='+endLat+'&dropoff[longitude]='+endLng+'&product_id='+output.prices[i].product_id+($('#startSearch').val()==""?"":("&pickup[nickname]="+$('#startSearch').val().replace(/\s/g,"%20")))+($('#destSearch').val()==""?"":("&dropoff[nickname]="+$('#destSearch').val().replace(/\s/g,"%20"))),
          eta: undefined
        }
      );
    }
    
    getUberTimes({ startLat: startLat,
     startLng: startLng
    }).then(function(result) {
      var output = JSON.parse(result.data);
      // Read result of the Cloud Function.
      for (var j = 0; j < uberRides.length; j++) {
          for (var i = 0; i < output.times.length; i++) {
            if(uberRides[j].product_id == output.times[i].product_id) {
              uberRides[j].eta = ''+parseInt(output.times[i].estimate/60)+' mins';
              break;
            }
            if(uberRides[j].eta == undefined)
              uberRides[j].eta = 'Not Available';
          }
        }
        uberReady = true;
        ready();
    });
  });

  lyftReady = false;
  lyftRides = [];
  getLyftPrices({ startLat: startLat,
   startLng: startLng,
   endLat: endLat,
   endLng: endLng
  }).then(function(result) {
    var output = JSON.parse(result.data);
    for (var i = 0; i < output.cost_estimates.length; i++) {
        lyftRides.push(
          {
            name: output.cost_estimates[i].display_name,
            highEstimate: output.cost_estimates[i].estimated_cost_cents_max/100,
            lowEstimate: output.cost_estimates[i].estimated_cost_cents_min/100,
            surge: output.cost_estimates[i].primetime_percentage=='0%'?1:output.cost_estimates[i].primetime_percentage,
            companyLogo: "<img src=lyftAssets/pngs/1x/lyft_16px.png>",
            surgeText: "<img src=lyftAssets/primetime_custom.png> +",
            estimate: output.cost_estimates[i].estimated_cost_cents_max==0?"N/A":output.cost_estimates[i].estimated_cost_cents_min==output.cost_estimates[i].estimated_cost_cents_max?'$'+parseInt(output.cost_estimates[i].estimated_cost_cents_max/100)+'.'+(output.cost_estimates[i].estimated_cost_cents_max%100<10?'0'+output.cost_estimates[i].estimated_cost_cents_max%100:output.cost_estimates[i].estimated_cost_cents_max%100):'$'+parseInt(output.cost_estimates[i].estimated_cost_cents_min/100)+'-'+parseInt(output.cost_estimates[i].estimated_cost_cents_max/100),
            service: "Lyft",
            product_id: output.cost_estimates[i].ride_type,
            orderLink: 'lyft://ridetype?id='+output.cost_estimates[i].ride_type+'&pickup[latitude]='+startLat+'&pickup[longitude]='+startLng+'&destination[latitude]='+endLat+'&destination[longitude]='+endLng,
            eta: undefined
          }
        );
      }
      getLyftTimes({
        startLat: startLat,
        startLng: startLng
      }).then(function(result) {
        var output = JSON.parse(result.data);
        for (var j = 0; j < lyftRides.length; j++) {
          for (var i = 0; i < output.eta_estimates.length; i++) {
            if(lyftRides[j].product_id == output.eta_estimates[i].ride_type) {
              lyftRides[j].eta = ''+parseInt(output.eta_estimates[i].eta_seconds/60)+' mins';
              break;
            }
            if(lyftRides[j].eta == undefined)
            lyftRides[j].eta = 'Not Available';
          }
        }
        lyftReady = true;
        ready();
      });
  });
}
