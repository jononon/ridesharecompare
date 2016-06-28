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
        console.log(price);
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
