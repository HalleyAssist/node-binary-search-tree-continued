const BinarySearchTree = require('../lib/bst')

var bst = new BinarySearchTree()
, keys = []
, executed = 0
;

let time = new Date()
for(let i = 0; i<10000; i++){
    bst.insert(10 + (i*11), 'yes');
    bst.insert(5 + (i*11), 'hello');
    bst.insert(3 + (i*11), 'yes2');
    bst.insert(8 + (i*11), 'yes3');
    bst.insert(15 + (i*11), 'yes3');
    bst.insert(159 + (i*11), 'yes3');
    bst.insert(11 + (i*11), 'yes3');
}
console.log("insert", (new Date) - time)

time = new Date()
for(let i=0;i<1000; i++){
    bst.betweenBounds({$gt: 100, $lt: 10000});
}
console.log((new Date) - time)

// orig: 383ms