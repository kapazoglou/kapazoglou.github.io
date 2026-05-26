(function(){
  figurate = function(){
    let 

    function choose(n,k){
      let result = 1;
      for (let i=1; i <= k; i++){
        result *= (n+1-i)/i;
      }
      return result;
    }
      
    function unchoose(number){
      let result=[]
      for( let n = 0; n <= number; n++ ){
      for( let k=0; k <= n; k++ ){
          if( choose(n,k) == number){
            result.push([n,k])
          }
        }
      }
      return result.reverse();
    }
    
    function simplex(num){  
      for ( let j=0; j < unchoose(num).length; j++ ){
        a = -j;
        b = 0;
        t = num;
      
        let n = unchoose(num)[j][0];
        let k = unchoose(num)[j][1];
        let d = [];
    
        (function loop(index) {
          if (index === k) {
          t--;
    
          drawPoint(t,a,b,15);
          return [a,b]
          }
          a += 1;
    
          for (let i = (index === 0 ? 0 : d[index-1] + 1); i < n; i++) {
          b = i-j;
    
          d[index] = i;
          loop(index + 1);
          }
        }(0));
    
        console.log(num+': '+unchoose(num)[j].join(' '))
      }
    } 
    
    function centred(number) {  
      let txt = 0
      for(let side = 3 ; side < number+1 ; side++) {
        for(let count = 1 ; count <= 30 ; count++) {
        if((side*count*count + side*count + 2) / 2 == number) { 
          
            addSVG(); // initialize
            drawPoint(txt++,hsz,hsz); // centre point
      
          let interval = (hsz - pt) / count;
      
          for(let ring = 1 ; ring <= count ; ring++) {
      
          let pts = [], radius = ring * interval;
          pts.push([hsz + radius, hsz]);
      
          let angle = 0;
          for(let s = 1 ; s < side ; s++) {
            angle += Math.PI * 2 / side;
            let x = Math.cos(angle) * radius;
            let y = Math.sin(angle) * radius;
            pts.push([hsz + x, hsz + y]);
          }
      
          for(let j = 0 ; j < pts.length ; j++) {
            let x = pts[j][0];
            let y = pts[j][1];
            let dx = pts[(j+1) % side][0] - x;
            let dy = pts[(j+1) % side][1] - y;
      
                drawPoint(txt++,x,y)//rings
      
            for(let k = 0 ; k < ring - 1 ; k++) {
            x += dx / ring;
            y += dy / ring;
      
                drawPoint(txt++,x,y)//intervals
            }
          }
          }
      
          txt = 0
          break;
        }
        }
      }
    }

    figurate.padding = function(value) {
      (!arguments.length)? return padding;
      padding = value;
      return figurate;
    }

    return figurate;
  };
})();