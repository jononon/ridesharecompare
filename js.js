$(document).ready(function () {
  navigator.geolocation.getCurrentPosition(function(location) {
    console.log(location.coords.latitude);
    console.log(location.coords.longitude);
    console.log(location.coords.accuracy);
  });
  $.ajax({
    url: 'https://api.uber.com/v1/estimates/price?start_latitude=34.146056&start_longitude=-118.746635&end_latitude=34.048117&end_longitude=-118.5060167&seat_count=1',
    dataType: 'json',
    success: function(output) {
      for (var i = 0; i < output.prices.length; i++) {
        $('#'+output.prices[i].display_name).append('<th>'+output.prices[i].localized_display_name+'</th><th>'+(output.prices[i].low_estimate+output.prices[i].high_estimate)/2+'</th>');
        console.log(output.prices[i].display_name);
      }
    },
    method: "GET",
    headers: {
      "authorization": "Token v_KOeq4LzWvcEhWFHQIUvHCUWWJN5OiSS46ckv5p",
    },
    async: false,
    timeout: 5000,
  });
  lyftbearer = "gAAAAABXkQMyvsFHAKvOJcT9uTFDy_jHYnIHzuS3gU-Ad3_GbD7E18UDtLGB_tzKTMw2Z9Az1Q5-gjR8k8la973MXE3cfAN7M5xF-kk-kk0pygUPvmS4mo7i8LAcfBr3_oVRH6nWYv8wTMOVfdhMh8KBfFEvqtdEyPtOZNUxlPAC9ljvrxEY6bE_svIcVGHSWx-n0lPxJPwDS6DHSFIo4fB9fM5R5kVGcg=="
  $.ajax({
    url: 'https://api.lyft.com/v1/cost?start_lat=34.146056&start_long=-118.746635&end_lat=34.048117&end_long=-118.5060167',
    dataType: 'json',
    success: function(output) {
      for (var i = 0; i < output.cost_estimates.length; i++) {
        estimatedCost = (output.cost_estimates[i].estimated_cost_cents_min+output.prices[i].estimated_cost_cents_max)/2;
        $('#'+output.cost_estimates[i].ride_type).append('<th>'+output.cost_estimates[i].display_name+'</th><th>'+estimatedCost%100+'.'+parseInt(estimatedCost/100)+'</th>');
      }
    },
    method: "GET",
    headers: {
      "Authorization": "Bearer "+lyftbearer,
    },
    async: false,
    timeout: 5000,
  })
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
