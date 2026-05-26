var IntegerPartition = require('integer-partition');

for (var arr of IntegerPartition.zs1(8)) {
    console.log(arr);
}

for (var arr of IntegerPartition.zs2(8)) {
    console.log(arr);
}