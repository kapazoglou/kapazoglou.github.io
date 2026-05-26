function fomb(n,k){

const N = Array.from(Array(n+k-1).keys());
const m = 7;//+(n%6);

const k_combinations = (set, k) => {                                            
  if (k > set.length || k <= 0) {                                               
    return []                                                                   
  }                                                                             
  if (k === set.length) {                                                       
    return [set]                                                    
  }                                                                             
  const combs = []                                                              
  if (k === 1) {                                                                
    for (let i = 0; i < set.length; i++) {                                      
      combs.push([set[i]])                                                      
    }                                                                           
    return combs                                                                
  }                                                                             
  for (let i = 0; i < set.length - k + 1; i++) {                                
    const head = set.slice(i, i + 1)                                            
    const tailcombs = k_combinations(set.slice(i + 1), k - 1)              
    for (let j = 0; j < tailcombs.length; j++) {                                
      combs.push(head.concat(tailcombs[j]))                                     
    }                                                                           
  }                                                                             
  return combs                                                                  
}                                                                               
                                                                                
const combinations = (set) => {                                                 
  const combs = [];                                                             
  for (let k = 1; k <= set.length; k++) {                                       
    const k_combs = k_combinations(set, k)                                      
    for (let i = 0; i < k_combs.length; i++) {                                  
      combs.push(k_combs[i])                                                    
    }                                                                           
  }                                                                             
  return combs                                                                  
}

let arr = k_combinations( N , k ).map( d => ({
  
       c: d.sort( (a,b) => b-a ) ,
  
       p: [ ( (n+k-1)-d[0]+d[2])%(n+k-1), d[0]-d[1], d[1]-d[2]].sort( (a,b) => b-a ) ,
  
       m: d.map( d => d % m ).sort( (a,b) => b-a )  ,
         
       s: ( d.filter( d => d >= m ).length % k == 0 )? 
                 ( null ) : ( 
              
                 ( d.filter( d => d >= m ).length == 1 )? 
                 ( d.filter( d => d >= m )) : ( d.filter( d => d < m ))  
              
               )[0]
  
    }))

let obj = arr.reduce((i, o) => ({ ...i, [o.m.reverse() +'  '+ o.p +'  ['+ o.c+'] ']: o.s }), {})

return arr
}


//BRANCH to fleck.js
//BRANCH to grid.js
//function for transposing