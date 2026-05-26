function fleck(a,x,y,xr,yr){
    var arr = [];
    var rot = [
        0, 1, 1, 0, 1, 1, 0,
        0, 2, 0, 1, 1, 1, 0,
        1, 0, 2, 0, 0, 0, 1,
        1, 0, 1, 2, 0, 1, 1,
        2, 1, 0, 0, 2, 0, 2,
        1, 2, 0, 0, 2, 1, 0,
        2, 0, 0, 1, 2, 2, 2,
        2, 2, 2, 2, 2, 2, 2,
        1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1,
        2, 2, 2, 2, 2, 2, 2
    ]; //2017 ManoKapazoglou

    dyadic(arr, 1, -1)
    function dyadic(a,offx,offy){
        a.push([offx, offy]);
        for (i = 0; i < Math.floor(x/y); i++) {
            for (j = 0; 2*j+1 <= Math.pow(2, i); j++) {
                a.push([offx, 2*(2*j+1)/Math.pow(2,i) + offy]);
            }
        }
    }

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

    function rotate(a, p) {
        for (var l = a.length, p = (Math.abs(p) >= l && (p %= l), p < 0 && (p += l), p), i, x; p; p = (Math.ceil(l / p) - 1) * p - l + (l = p))
            for (i = l; i > p; x = a[--i], a[i] = a[i - p], a[i - p] = x);
        return a;
    }

    function scale(a,nx,ny) {
        for (var i = 0; i < a.length; i++){
            return [a[0]*nx, a[1]*ny]
        }
    }

    var b = multi(Array.from(Array(x).keys()), y).reverse();
    for (i = 0; i < b.length; i++) {
        var c = [] 
        
        rotate(b[i], rot[i]);
        for (var j = 0; j < b[i].length; j++) {
            var d = [];
            //SUITS EXCEPT ZEROES
            if (b[i][j] !== 0)  {
                if (b[i][0] !== 0){
                    for (var k = 0; k < Math.ceil(b[i][j]/2); k++){
                        if (b[i][j] > (2*k)+1){
                           d.push(scale(arr[k],        Math.pow(xr,j%2+1)*Math.pow(yr,j%2) , Math.pow(xr,j%2+1)*Math.pow(yr,j%2+1)), 
                            scale(scale(arr[k],-1,-1), Math.pow(xr,j%2+1)*Math.pow(yr,j%2) , Math.pow(xr,j%2+1)*Math.pow(yr,j%2+1)));
                        }
                    }
                    if (b[i][j] % 2 !== 0) {
                    d.push([0,0]);
                    }
                //SUITS BETWEEN ZEROES
                } else {
                    for (var k = 0; k < Math.ceil(b[i][j]/2); k++){
                        if (b[i][j] > (2*k)+1){
                           d.push(scale(arr[k], xr, xr*yr), 
                            scale(scale(arr[k],-1,-1), xr, xr*yr));
                       }
                    }
                    if (b[i][j] % 2 !== 0) {
                        d.push([0,0]);
                    }
                }
            //ZEROES
            } else {
                for (var k = 0; k < x ; k++){
                    if ( x > (2*k)+1){
                       d.push(scale(arr[k], xr*Math.pow(2, Math.floor(k%3/2)) , xr*yr), 
                        scale(scale(arr[k],-1,-1), xr*Math.pow(2, Math.floor(k%3/2)) , xr*yr));
                   }
                }
                d.push([0,0]);
            }
            c.push(d);
        }
        a.push(c);
    }
}