/*
startLat = 34.145954;
startLng = -118.748161;
endLat = 34.0481852;
endLng = -118.5038797;
*/
var uberToken, lyftToken
$(document).ready(function() {
  $.ajax({
    url:"https://api.lyft.com/oauth/token",
    dataType:"json",
    headers: {
        'Content-Type': 'application/json',
        Authorization: "Basic " + btoa("v3OmgqE86Nhu:197pfsoEIr-I_wYYBMA7-sUaMB9zknAx")
    },
    data: JSON.stringify({
      grant_type: 'client_credentials',
      scope: 'public'
    }),
    success: function (output) {
      lyftToken = output.access_token;
    },
    type: "POST",
    contentType: "application/json",
    async: false,
    timeout: 5000
  });
});

function calculateRides (startLat, startLng, endLat, endLng) {

  var rides = [];
  $.ajax({
    url: 'https://api.uber.com/v1/estimates/price?start_latitude='+startLat+'&start_longitude='+startLng+'&end_latitude='+endLat+'&end_longitude='+endLng+'&seat_count=1',
    dataType: 'json',
    success: function(output) {
      for (var i = 0; i < output.prices.length; i++) {
        rides.push(
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
            orderLink: 'https://m.uber.com/ul?action=setPickup&pickup[latitude]='+startLat+'&pickup[longitude]='+startLng+'&dropoff[latitude]='+endLat+'&dropoff[longitude]='+endLng+'&product_id='+output.prices[i].product_id,
            eta: undefined
          }
        );
      }
    },
    method: "GET",
    headers: {
      "authorization": "Token v_KOeq4LzWvcEhWFHQIUvHCUWWJN5OiSS46ckv5p",
    },
    async: false,
    timeout: 5000,
  });
  $.ajax({
    url: 'https://api.uber.com/v1/estimates/time?start_latitude='+startLat+'&start_longitude='+startLng,
    dataType: 'json',
    success: function(output) {
      for (var j = 0; j < rides.length; j++) {
        for (var i = 0; i < output.times.length; i++) {
          if(rides[j].product_id == output.times[i].product_id) {
            rides[j].eta = ''+parseInt(output.times[i].estimate/60)+' mins';
            break;
          }
          if(rides[j].eta == undefined)
            rides[j].eta = 'Not Available';
        }
      }
    },
    method: "GET",
    headers: {
      "authorization": "Token v_KOeq4LzWvcEhWFHQIUvHCUWWJN5OiSS46ckv5p",
    },
    async: false,
    timeout: 5000,
  });
  $.ajax({
    url: 'https://api.lyft.com/v1/cost?start_lat='+startLat+'&start_lng='+startLng+'&end_lat='+endLat+'&end_lng='+endLng,
    dataType: 'json',
    success: function(output) {
      for (var i = 0; i < output.cost_estimates.length; i++) {
        rides.push(
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
    },
    method: "GET",
    headers: {
      "Authorization": "Bearer " + lyftToken
    },
    async: false,
    timeout: 5000,
  });
    $.ajax({
      url: 'https://api.lyft.com/v1/eta?lat='+startLat+'&lng='+startLng,
      dataType: 'json',
      success: function(output) {
        for (var j = 0; j < rides.length; j++) {
          for (var i = 0; i < output.eta_estimates.length; i++) {
            if(rides[j].product_id == output.eta_estimates[i].ride_type) {
              rides[j].eta = ''+parseInt(output.eta_estimates[i].eta_seconds/60)+' mins';
              break;
            }
            if(rides[j].eta == undefined)
            rides[j].eta = 'Not Available';
          }
        }
      },
    method: "GET",
    headers: {
      "Authorization": "Bearer " + lyftToken
    },
    async: false,
    timeout: 5000,
  });
  var start = {
    lat:startLat,
    lng:startLng
  }
  var end = {
    lat:endLat,
    lng:endLng
  }
  transit = calculateTransitTimes(start, end);
  if(transit!=undefined) {
    rides.push(transit);
  }

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
  rides.sort(comparePrice);
  tablehtml = "<tr><th>Ride</th><th>"/*surge*/+"</th><th>Cost</th><th>ETA</th><th></th></tr>";
  for (var i = 0; i < rides.length; i++) {
    tablehtml+='<tr><td>'+rides[i].companyLogo+' '+rides[i].name+'</td><td>'+(rides[i].surge!=1?' '+rides[i].surgeText+' '+rides[i].surge:'')+'</td><td>'+rides[i].estimate+'</td><td>'+rides[i].eta+'</td><td><a href='+rides[i].orderLink+'><button type="button" class="btn btn-default">Go!</button></a></td></tr>'
  }
  $('#prices').html(tablehtml);
  $('#lastUpdated').html("Last Updated: "+(new Date()).toLocaleString());
}
var directionsService;
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
    if(originMarker.position != undefined && destMarker.position != undefined)
    calculateRides(originMarker.position.lat(), originMarker.position.lng(), destMarker.position.lat(), destMarker.position.lng());
    calculateAndDisplayRoute(originMarker.position, destMarker.position);
  }

  function calculateAndDisplayRoute(start, end) {
    directionsService.route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
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
    if(originMarker.position != undefined && destMarker.position != undefined) {
      calculateRides(originMarker.position.lat(), originMarker.position.lng(), destMarker.position.lat(), destMarker.position.lng());
    }
  });
}

function calculateTransitTimes(start, end) {
  directionsService.route({
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.TRANSIT
  }, function(response, status) {
    if(status === "OK") {
      description = "";
      travelTime = 0;
      for (var i = 0; i < response.routes[0].legs.length; i++) {
        travelTime+=response.routes[0].legs[i].duration.value;
        if(response.routes[0].legs[i].travel_mode == "TRANSIT")
          description += "<img src="+response.routes[0].legs[i].line.vehichle.local_icon+"></img> "+response.routes[0].legs[i].line.short_name+((i<response.routes[0].legs.length-1)?" &#x25b6; ":"");
      }
      return ({
        name: description,
        highEstimate: "",
        lowEstimate: "",
        surge: "",
        companyLogo: "",
        surgeText: "",
        estimate:"",
        service: "Transit",
        product_id: "Transit",
        orderLink: 'https://m.uber.com/ul?action=setPickup&pickup[latitude]='+startLat+'&pickup[longitude]='+startLng+'&dropoff[latitude]='+endLat+'&dropoff[longitude]='+endLng+'&product_id='+output.prices[i].product_id,
        eta: ((travelTime/60/60>=1)?""+parseInt(travelTime/60/60)+" hours and ":"")+travelTime/60%60+" minutes"
      });
    }
  });
  return undefined;
}
