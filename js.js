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
        $('#'+output.prices[i].display_name).append('<th>'+output.prices[i].localized_display_name+'</th><th>'+(output.prices[i].low_estimate+output.prices[i].high_estimate)/2*output.prices[i].surge_multiplier+'</th>');
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
});

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
