const n = 7
const k = 3
const arr = Array.from(Array(7).keys());
const gen = multi(arr,3)
const out = gen.map( d => rotate( d, rotDir(d) ) )
               .filter( d => [...new Set(d)].length != 1 )
               .sort( (a,b) => (a[0]+a[2]) - (b[0]+b[2]) )
               .sort( (a,b) => a[1]-b[1] )
               .map( d => d.join('') )

console.log( out )

function multi(a, l) {
   if (l === void 0) l = a.length;
     var d = Array(l),
         c = [];
     (function f(p, s) {
         if (p === l) {
           c.push(d.slice());
           return;
         }
     for (var i = s; i < a.length; i++) {
        d[p] = a[i];
        f(p + 1, i);
     }
   })(0, 0); 
    return c;
}

function double(e){
  var uniq = e.map((e) => { return { count: 1, e: e };})
              .reduce((a, b) => { a[b.e] = (a[b.e] || 0) + b.count; 
              return a;}, {})
    return parseInt( Object.keys(uniq).filter((a) => uniq[a] > 1 ) )
}

function check(e){
  // has 0 
  if(  e.includes(0) ){ return true; } else
  // has 43 or 61
  if(  e.includes(4) && e.includes(3) ){ return true; } else
  if(  e.includes(6) && e.includes(1) ){ return true; } else
  // has 55 and even or 22 and odd
  if( double(e) == 5 && e.filter( d => d != 5)%2 == 0 ){ return true; } else
  if( double(e) == 2 && e.filter( d => d != 2)%2 == 1 ){ return true; } else
  // has 44 or 33 and 6 or 1 
  if( double(e) == 4 && e.filter( d => d != 4)%5 == 1 ){ return true; } else
  if( double(e) == 3 && e.filter( d => d != 3)%5 == 1 ){ return true; } else
  //236 or 145
  if( e.includes(2) && e.includes(3) && e.includes(6) ){ return true; } else
  if( e.includes(1) && e.includes(4) && e.includes(5) ){ return true; } else

  { return false; }
}

function rotDir(e){
    if( check(e) === false ){
      // for singles
      if( isNaN( double(e) ) ) { 
        // sum is smaller than 10; right
        if( e.reduce( (a,b) => a+b ) > 10 ) { return 1; }
        // sum is larger than 10; left 
        else { return 2; }
      // for doubles
      }else{
        // doubled number is larger; right
        if ( double(e) > e.filter(d => d != double(e)) ){ return 1; }
        // doubled number is smaller; left
        else { return 2; }
      }
    // double zeroes
    }else if( double(e) == 0 ){ return 2; }
    // single zero
     else if( e.includes(0) ){ return 1; }
     else { return 0 } 
}


function rotate(a, p) {
    for (var l = a.length, p = (Math.abs(p) >= l && (p %= l), p < 0 && (p += l), p), i, x; p; p = (Math.ceil(l / p) - 1) * p - l + (l = p))
       for (i = l; i > p; x = a[--i], a[i] = a[i - p], a[i - p] = x);
    return a;
}