function necklaces(chars){
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

  var perms =  0;
  var output_text = [];
  var new_perm = "";
  var test_perm = "";
  var okay = true;
  var firstcomma = -1;
  var busy = true;
  var dmax=d;
  
  do {    
      okay = true;
      new_perm = "";
      
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
        perms++;
        output_text.push(new_perm)
        b = output_text
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