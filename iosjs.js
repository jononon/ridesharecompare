/*
startLat = 34.145954;
startLng = -118.748161;
endLat = 34.0481852;
endLng = -118.5038797;
*/
var directionsService;
var travelTimeDriving;
var uberToken, lyftToken
function run () {
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

  var startLat = getParameterByName('startLat');
  var startLng = getParameterByName('startLng');
  var endLat = getParameterByName('endLat');
  var endLng = getParameterByName('endLng');
  calculateRides (startLat, startLng, endLat, endLng)
}

function calculateRides (startLat, startLng, endLat, endLng) {

  var rides = [];
  $.ajax({
    url: 'https://api.uber.com/v1/estimates/price?start_latitude='+startLat+'&start_longitude='+startLng+'&end_latitude='+endLat+'&end_longitude='+endLng+'&seat_count=1',
    dataType: 'json',
    success: function(output) {
      for (var i = 0; i < output.prices.length; i++) {
        //Add prices for uber
        rides.push(
          {
            name: output.prices[i].localized_display_name,
            highEstimate: output.prices[i].high_estimate,
            lowEstimate: output.prices[i].low_estimate,
            surge: output.prices[i].surge_multiplier,
            companyLogo: "https://jonathandamico.me/ridesharecompare/uberAssets/RIDESAPIICON/SVG/uber_rides_api_icon.svg",
            surgeText: "https://jonathandamico.me/ridesharecompare/uberAssets/UBERSURGEICON/PNGs/1x/Uber_Surge_Icon_16px.png",
            estimate: output.prices[i].estimate,
            service: "Uber",
            product_id: output.prices[i].product_id,
            orderLink: 'uber://?action=setPickup&pickup[latitude]='+startLat+'&pickup[longitude]='+startLng+'&dropoff[latitude]='+endLat+'&dropoff[longitude]='+endLng+'&product_id='+output.prices[i].product_id,
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
            companyLogo: "https://jonathandamico.me/ridesharecompare/lyftAssets/pngs/1x/lyft_16px.png",
            surgeText: "https://jonathandamico.me/ridesharecompare/lyftAssets/primetime_custom.png",
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
  document.write(JSON.stringify(rides));

  console.log("does it work?");
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}