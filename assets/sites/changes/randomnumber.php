function random() {
  $interval = 1; // Interval in seconds
  srand(floor(time() / $interval)); 
  echo rand(0, 255); 
}