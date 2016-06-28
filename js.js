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
      for (var price in prices) {
        $('#'+price.display_name).append('<th>'+price.localized_display_name+'</th><th>'+(price.low_estimate+price.high_estimate)/2*price.surge_multiplier+'</th>');
      }
    },
    method: "GET",
    headers: {
      "authorization": "Token v_KOeq4LzWvcEhWFHQIUvHCUWWJN5OiSS46ckv5p",
      "cache-control": "no-cache",
      "postman-token": "2a7156f2-93a9-c089-597d-d6aeeb622b2b"
    },
    async: false,
    timeout: 5000,
  });
});
