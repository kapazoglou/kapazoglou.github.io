console.log(combinations(12,3,1))

function combinations(n,k,rep,out){
  //let n = 1;
  //let k = 1;
  //let rep = false;
  let x = k;
  let N = ( rep != 0 )? n+k-1 : n;
  
  necklaces = function (chars){
    var d=0;
    var a = [];
    var b = [];
    
    (function () {
      var charray = [];
      var frequency = [];
      var inputchar, ii, jj, cc, ccc, nn=0;
    
        for (ii=0; ii<chars.length; ii++) {
        inputchar = chars[ii];
        cc = -1;
    
        for (ccc=0; ccc<charray.length; ccc++) { if (inputchar == charray[ccc]) cc = ccc; }
    
        if (cc<0) {
          charray[charray.length] = inputchar;
          frequency[frequency.length] = 1;
        } else {
          frequency[cc]++;
        }
      }
    
      d = 0;
    
      for (ii=0; ii<frequency.length; ii++) {
        cc = frequency[ii];
        for (jj=0; jj<cc; jj++) {
          a[d] = nn;
          d++;
        }
        nn++;
      }
      var output_text = [];
      var new_perm = [];
      var test_perm = [];
      var okay = true;
      var firstcomma = -1;
      var busy = true;
      var dmax=d;
      
      do {    
          okay = true;
          new_perm = [];
          
          for (ii=0; ii<dmax; ii++) {
              new_perm = new_perm + charray[a[ii]];
              if (ii<dmax-1) new_perm = new_perm+",";
          }    
          test_perm = new_perm;
          var test_perm_len = test_perm.length;
          for (ii=0; ii<dmax-1; ii++) {
             firstcomma = test_perm.indexOf(",");
             test_perm = test_perm.substring(firstcomma+1,test_perm_len) + "," + test_perm.substring(0,firstcomma);
            
             if ( output_text.indexOf(test_perm) >-1 ) {
                okay = false;
                break;
             }
           }
        
        if (okay) {
            output_text.push( new_perm )
            b = output_text//.map( d => d.split(',').map( d => parseInt(d) ) )
        }
        
        }while( nextperm() && busy);
    })()
    
    function nextperm() {
      var i, j, k, swap, s, si;
      
      for (k=d-2; k>=0; k--) {
        if (a[k] < a[k+1]) {
          s  = a[k+1];
          si = k+1;
          for (i=k+2; i<d; i++) {
            if ((a[i]>a[k])&&(a[i]<s)) {
              s = a[i];
              si = i;
            }
          }
          swap  = a[si];
          a[si] = a[k];
          a[k]  = swap;
          for (i=k+1; i<d-1; i++) {
            for (j=i+1; j<d; j++) {
              if (a[i]>a[j]) {
                swap = a[i];
                a[i] = a[j];
                a[j] = swap;
              }
            }
          }
          return(true);
        }
      }
      return(false);
    }
    
    return b
  }
  
  cumul = function (a) {
    let r = [a[0]];

    for(let i = 1; i < a.length; i++) {
      r[i] = r[i - 1] + a[i];
    }

    return r;
  }
  
  ipd = function* (n,k) {
    "use strict";

    if (n <= 0) throw new Error('positive integer only');
    yield [n];

    var x = new Array(n);
    x[0] = n;
    for (var i = 1; i < n; i++) x[i] = 1;

    var m = 0, h = 0, r, t;
    while (x[0] != 1) {
        if (x[h] == 2) {
            m += 1;
            x[h] = 1;
            h -= 1;
        } else {
            r = x[h] - 1;
            x[h] = r;

            t = m - h + 1;
            while (t >= r) {
                h += 1;
                x[h] = r;
                t -= r;
            }
            m = h + (t !== 0 ? 1 : 0);
            if (t > 1) {
                h += 1;
                x[h] = t;
            }
        }
        yield x.slice(0, m + 1);
    }
  }
  
  function fact(x) {
    if (x < 0) return;
    if (x === 0) return 1;
    return x * fact(x - 1);
  }
  
  function* comb(e, l) {
    for (let i = 0; i < e.length; i++) {
      if (l === 1) {
        yield [e[i]];
      } else {
        let r = comb(e.slice(i + 1, e.length), l - 1);
        for (let next of r) {
          yield [e[i], ...next];
        }
      }
    }
  }
  
  let data = ( rep != 0 )?
    [...ipd(n)]
      .filter( d => d.length <= k )
      .map( (d,i) => ( d.length < k )? d.concat(Array(k).fill(0)).slice(0,k) : d )
      .map( d => necklaces(d) )
  :
    [...ipd(n)]
      .filter( d => d.length == k )
      .map( d => necklaces(d)
  )
  
  let combi = []
    .concat(...data)
  //convert to array
    .map( d => d.split(',').map( d => parseInt(d) ) )
  
  //make n copies of each k-array
    .map( d => Array(n).fill(d) )
  //return cumulative sums of each k-array
    .map( d => d.map( d => cumul(d) ) )
  //generate rotations by adding an increasing value
    .map( d => d.map( (d,i) => d.map( d => (d+i)%n +1 ).sort( (a,b) => a-b ) ))
  //remove duplicates
    .map( d => [...new Set( d.map( d => d.join('-') ) )].map( d => d.split('-').map( d => parseInt(d) ) ))
  
  //style
    .map( d => d.map( d => d.map( d => (d<11)? 
                                    String.fromCharCode(10101 + d ):
                                    String.fromCharCode(9440 +d ) ) ) )
    .map( d => d.map( d => d.join('') ).join(String.fromCharCode(8194)) )
    .join('\n ')
  
  let neck = data
    .map( d => d.map( d => d.split(',').map( d => parseInt(d) ) ) )
    .map( d => d.map( d => d.map( d => 
                                 ( (d!=0)?
                                    String.fromCharCode(9311 +d ) :
                                    String.fromCharCode(9450 +d ) 
                                 ) ) ) )
    .map( d => d.map( d => d.join('') ).join(String.fromCharCode(8194)) )
    .join('\n ')

  if ( out == null){
      return combi+'\n\n '+fact(N)/(fact(N-k)*fact(k))
  }else{
      return neck+'\n\n '+Math.ceil(fact(N)/(fact(N-k)*fact(k))/n)
  }
}