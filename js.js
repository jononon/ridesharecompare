$(document).ready(function () {
  navigator.geolocation.getCurrentPosition(function(location) {
    console.log(location.coords.latitude);
    console.log(location.coords.longitude);
    console.log(location.coords.accuracy);
  });
  startLat = 34.145954;
  startLng = -118.748221;
  endLat = 34.0481852;
  endLng = -118.5038797;
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
            companyLogo: "<img src=uberAssets/RIDESAPIICON/PNG/uber_rides_api_icon_1x_28px.png>",
            surgeText: "<img src=uberAssets/UBERSURGEICON/PNGs/1x/Uber_Surge_Icon_28px.png>",
            estimate: output.prices[i].estimate,
            service: "Uber",
            product_id: output.prices[i].product_id,
            orderLink: 'https://m.uber.com/ul?action=setPickup&pickup[latitude]='+startLat+'&pickup[longitude]='+startLng+'&pickup[nickname]=inVia&pickup[formatted_address]=3304%20Derry%20Ave%2C%20Agoura%20Hills%2C%20CA%2091301&dropoff[latitude]='+endLat+'&dropoff[longitude]='+endLng+'&dropoff[formatted_address]=1124%20Napoli%20Drive%2C%20Pacific%20Palisades%2C%20CA%2090272&product_id='+output.prices[i].product_id,
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
            companyLogo: "<img src=lyftAssets/pngs/1x/lyft_28px.png>",
            surgeText: "Primetime",
            estimate: output.cost_estimates[i].estimated_cost_cents_min==output.cost_estimates[i].estimated_cost_cents_max?'$'+parseInt(output.cost_estimates[i].estimated_cost_cents_max/100)+'.'+(output.cost_estimates[i].estimated_cost_cents_max%100<10?'0'+output.cost_estimates[i].estimated_cost_cents_max%100:output.cost_estimates[i].estimated_cost_cents_max%100):'$'+parseInt(output.cost_estimates[i].estimated_cost_cents_min/100)+'-'+parseInt(output.cost_estimates[i].estimated_cost_cents_max/100),
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
      "Authorization": "Bearer gAAAAABXkQMyvsFHAKvOJcT9uTFDy_jHYnIHzuS3gU-Ad3_GbD7E18UDtLGB_tzKTMw2Z9Az1Q5-gjR8k8la973MXE3cfAN7M5xF-kk-kk0pygUPvmS4mo7i8LAcfBr3_oVRH6nWYv8wTMOVfdhMh8KBfFEvqtdEyPtOZNUxlPAC9ljvrxEY6bE_svIcVGHSWx-n0lPxJPwDS6DHSFIo4fB9fM5R5kVGcg==",
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
      "Authorization": "Bearer gAAAAABXkQMyvsFHAKvOJcT9uTFDy_jHYnIHzuS3gU-Ad3_GbD7E18UDtLGB_tzKTMw2Z9Az1Q5-gjR8k8la973MXE3cfAN7M5xF-kk-kk0pygUPvmS4mo7i8LAcfBr3_oVRH6nWYv8wTMOVfdhMh8KBfFEvqtdEyPtOZNUxlPAC9ljvrxEY6bE_svIcVGHSWx-n0lPxJPwDS6DHSFIo4fB9fM5R5kVGcg==",
    },
    async: false,
    timeout: 5000,
  });

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
  tablehtml = "<tr><th>Ride</th><th>"/*surge*/+"</th><th>Cost</th><th>ETA</th><th>Go!</th></tr>";
  for (var i = 0; i < rides.length; i++) {
    tablehtml+='<tr><td>'+rides[i].companyLogo+' '+rides[i].name+'</td><td>'+(rides[i].surge!=1?' '+rides[i].surgeText+' '+rides[i].surge:'')+'</td><td>'+rides[i].estimate+'</td><td>'+rides[i].eta+'</td><td><a href='+rides[i].orderLink+'><button type="button" class="btn btn-default">Request</button></a></td></tr>'
  }
  $('#prices').append(tablehtml);
});
/*curl -X POST -H "Content-Type: application/json" \
     --user "v3OmgqE86Nhu:197pfsoEIr-I_wYYBMA7-sUaMB9zknAx" \
     -d '{"grant_type": "client_credentials", "scope": "public"}' \
     'https://api.lyft.com/oauth/token'
     */

function initMap() {
      var center = {lat: 51.5037819, lng: -0.2243051};
      // Create a map object and specify the DOM element for display.
      var map = new google.maps.Map(document.getElementById('map'), {
        center: center,
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
      // Create a marker and set its position.
      var marker = new google.maps.Marker({
        map: map,
        position: {lat: 51.491541, lng: -0.176366}
      });
    }
