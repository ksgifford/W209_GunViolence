$(function(){

   $('#nav-international-tab').one('click', function() {
     $('#oecdModal').modal('show');
   });

   $('#nav-map-tab').one('click', function() {
     $('#mapModal').modal('show');
   });

   $('#nav-deaths-tab').one('click', function() {
     $('#deathsModal').modal('show');
   });

   $('#nav-weapons-tab').one('click', function() {
     $('#weaponModal').modal('show');
   });

   $('#nav-perps-tab').one('click', function() {
     $('#perpsModal').modal('show');
   });
});
