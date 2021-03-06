/**
 * Self-balancing binary search tree using the AVL implementation
 */
const BinarySearchTree = require('./bst'),
      customUtils = require('./customUtils')


const {_betweenBounds, _checkNodeOrdering, _getMaxKeyDescendant, _getMinKeyDescendant, _search, _searchAfter, _searchBefore, _searchNearest, _searchNearestGte, _searchNearestLte, _getLowerBoundMatcher, _getUpperBoundMatcher, ReturnAlways} = require('./common')

/**
* Insert a key, value pair in the tree while maintaining the AVL tree height constraint
* Return a pointer to the root node, which may have changed
*/

function _insert(root, node, key, value) {
  let insertPath = [], currentNode = node

  // Insert new leaf at the right place
  do {
    // Same key: no change in the tree structure
    const comparisonResult = root.compareKeys(key, currentNode.key)
    if (comparisonResult === 0) {
      if (root.unique) {
        if (currentNode.includes(value)) return
        var err = new Error("Can't insert key " + key + ", it violates the unique constraint");
        err.key = key;
        err.errorType = 'uniqueViolated';
        throw err;
      }
      
      if (root.vkUnique && currentNode.includes(value)) return
      currentNode.push(value);
      return node;
    }

    insertPath.push(currentNode);

    if (comparisonResult < 0) {
      if (!currentNode.left) {
        insertPath.push(currentNode.createLeftChild({ key, value }));
        break;
      } 
      
      currentNode = currentNode.left;
    } else if (!currentNode.right) {
      insertPath.push(currentNode.createRightChild({ key, value }));
      break;
    }else{    
      currentNode = currentNode.right;
    }
  } while (true);


  return node.rebalanceAlongPath(insertPath);
}


/**
 * Delete a key or just a value and return the new root of the tree
 * @param {Key} key
 * @param {Value} value Optional. If not set, the whole key is deleted. If set, only this value is deleted
 */
function _delete(root, node, key, value) {
  var replaceWith
    , currentNode = node
    , deletePath = []
    ;

  // Either no match is found and the function will return from within the loop
  // Or a match is found and deletePath will contain the path from the root to the node to delete after the loop
  while (true) {
    const comparisonResult = root.compareKeys(key, currentNode.key)
    if (comparisonResult === 0) break

    deletePath.push(currentNode);

    if (comparisonResult < 0) {
      if (!currentNode.left) return node;   // Key not found, no modification
      currentNode = currentNode.left
    } else {
      // currentNode.compareKeys(key, currentNode.key) is > 0
      if (!currentNode.right) return node;   // Key not found, no modification
      currentNode = currentNode.right;
    }
  }

  // Delete only a value (no tree modification)
  if (currentNode.length > 1 && value !== undefined) {
    for(let i=currentNode.length;i--;){
      if (root.checkValueEquality(currentNode[i], value)) currentNode.splice(i, 1)
    }
    return node;
  }

  // Delete a whole node

  // Leaf
  if (!currentNode.left && !currentNode.right) {
    if (currentNode === node) {   // node leaf is also the root
      delete currentNode.key;
      currentNode.splice(0, node.length)
      currentNode.height = null
      return node;
    }
    
    if (currentNode.parent.left === currentNode) {
      currentNode.parent.left = null;
    } else {
      currentNode.parent.right = null;
    }
    return node.rebalanceAlongPath(deletePath);
  }


  // Node with only one child
  if (!currentNode.left || !currentNode.right) {
    replaceWith = currentNode.left ? currentNode.left : currentNode.right;

    if (currentNode === node) {   // This node is also the root
      replaceWith.parent = null;
      return replaceWith;   // height of replaceWith is necessarily 1 because the tree was balanced before deletion
    } else {
      if (currentNode.parent.left === currentNode) {
        currentNode.parent.left = replaceWith;
        replaceWith.parent = currentNode.parent;
      } else {
        currentNode.parent.right = replaceWith;
        replaceWith.parent = currentNode.parent;
      }

      return node.rebalanceAlongPath(deletePath);
    }
  }


  // Node with two children
  // Use the in-order predecessor (no need to randomize since we actively rebalance)
  deletePath.push(currentNode);
  replaceWith = currentNode.left;

  // Special case: the in-order predecessor is right below the node to delete
  if (!replaceWith.right) {
    currentNode.key = replaceWith.key;
    currentNode.replaceData(replaceWith)
    currentNode.left = replaceWith.left;
    if (replaceWith.left) { replaceWith.left.parent = currentNode; }
    return node.rebalanceAlongPath(deletePath);
  }

  // After this loop, replaceWith is the right-most leaf in the left subtree
  // and deletePath the path from the root (inclusive) to replaceWith (exclusive)
  while (true) {
    if (!replaceWith.right) break
    deletePath.push(replaceWith);
    replaceWith = replaceWith.right;
  }

  currentNode.key = replaceWith.key;
  currentNode.replaceData(replaceWith)

  replaceWith.parent.right = replaceWith.left;
  if (replaceWith.left) replaceWith.left.parent = replaceWith.parent

  return node.rebalanceAlongPath(deletePath);
}

class AVLTreeNode extends BinarySearchTree.Node {
  constructor(options){
    super(options)
    this.height = 1
  }

  createSimilar(options) {
    return new AVLTreeNode(options);
  }

  

  /**
   * Check the recorded height is correct for every node
   * Throws if one height doesn't match
   */
  checkHeightCorrect() {
    if (!this.hasOwnProperty('key')) return   // Empty tree

    if (this.left && this.left.height === undefined) { throw new Error("Undefined height for node " + this.left.key); }
    if (this.right && this.right.height === undefined) { throw new Error("Undefined height for node " + this.right.key); }

    if (this.height === undefined) { throw new Error("Undefined height for node " + this.key); }
    const leftH = this.left ? this.left.height : 0;
    const rightH = this.right ? this.right.height : 0;

    if (this.height !== 1 + Math.max(leftH, rightH)) { throw new Error("Height constraint failed for node " + this.key); }
    if (this.left) { this.left.checkHeightCorrect(); }
    if (this.right) { this.right.checkHeightCorrect(); }
  }


  /**
   * Return the balance factor
   */
  balanceFactor() {
    const leftH = this.left ? this.left.height : 0
      , rightH = this.right ? this.right.height : 0
    return leftH - rightH;
  }


  /**
   * Check that the balance factors are all between -1 and 1
   */
  checkBalanceFactors() {
    if (Math.abs(this.balanceFactor()) > 1) { throw new Error('Tree is unbalanced at node ' + this.key); }

    if (this.left) { this.left.checkBalanceFactors(); }
    if (this.right) { this.right.checkBalanceFactors(); }
  }  


  /**
   * When checking if the BST conditions are met, also check that the heights are correct
   * and the tree is balanced
   */
  checkIsAVLT() {
    this.checkHeightCorrect();
    this.checkBalanceFactors();
  }


  /**
   * Perform a right rotation of the tree if possible
   * and return the root of the resulting tree
   * The resulting tree's nodes' heights are also updated
   */
  rightRotation() {
    let p = this.left

    if (!p) return this   // No change

    let b = p.right;

    // Alter tree structure
    if (this.parent) {
      p.parent = this.parent;
      if (this.parent.left === this) { this.parent.left = p; } else { this.parent.right = p; }
    } else {
      p.parent = null;
    }
    p.right = this;
    this.parent = p;
    this.left = b;
    if (b) b.parent = this

    // Update heights
    this.height = Math.max(b ? b.height : 0, this.right ? this.right.height : 0) + 1;
    p.height = Math.max(p.left ? p.left.height : 0, this.height) + 1;

    return p;
  }


  /**
   * Perform a left rotation of the tree if possible
   * and return the root of the resulting tree
   * The resulting tree's nodes' heights are also updated
   */
  leftRotation() {
    let q = this.right

    if (!q) { return this; }   // No change

    let b = q.left;

    // Alter tree structure
    if (this.parent) {
      q.parent = this.parent;
      if (this.parent.left === this) { this.parent.left = q; } else { this.parent.right = q; }
    } else {
      q.parent = null;
    }
    q.left = this;
    this.parent = q;
    this.right = b;
    if (b) b.parent = this

    // Update heights
    this.height = Math.max(this.left ? this.left.height : 0, b ? b.height : 0) + 1;
    q.height = Math.max(q.right ? q.right.height : 0, this.height) + 1;

    return q;
  }


  /**
   * Rebalance the tree along the given path. The path is given reversed (as he was calculated
   * in the insert and delete functions).
   * Returns the new root of the tree
   * Of course, the first element of the path must be the root of the tree
   */
  rebalanceAlongPath(path) {
    // Handle empty tree
    if (!this.hasOwnProperty('key')) {
      this.height = null
      return this;
    }

    let newRoot = this

    // Rebalance the tree and update all heights
    for (let i = path.length; i--;) {
      const p = path[i]
      p.height = 1 + Math.max(p.left ? p.left.height : 0, p.right ? p.right.height : 0);

      const balanceFactor = p.balanceFactor()
      if (balanceFactor > 1) {
        if (p.left.balanceFactor() < 0) {
          p.left.leftRotation();
        }
        const rotated = p.rightRotation();
        if (i === 0) { newRoot = rotated; }
      } else if (balanceFactor < -1) {
        if (p.right.balanceFactor() > 0) {
          p.right.rightRotation();
        }
    
        const rotated = p.leftRotation();
        if (i === 0) { newRoot = rotated; }
      }
    }

    return newRoot
  }
}


class AVLTree {
  /**
   * Constructor
   * 
   * We can't use a direct pointer to the root node (as in the simple binary search tree)
   * as the root will change during tree rotations
   * 
   * @param {Object} options Optional
   * @param {Boolean}  options.unique Whether to enforce a 'unique' constraint on the key or not
   * @param {Key}      options.key Initialize this BST's key with key
   * @param {Value}    options.value Initialize this BST's data with [value]
   * @param {Function} options.compareKeys Initialize this BST's compareKeys
   */
  constructor(options) {
    options = options || {};
    this.tree = new AVLTreeNode(options);

    this.unique = options.unique || false;
    this.vkUnique = options.vkUnique || false;

    this.compareKeys = options.compareKeys || customUtils.defaultCompareKeysFunction;
    this.checkValueEquality = options.checkValueEquality || customUtils.defaultCheckValueEquality;
  }


  // Delete a value
  delete(key, value) {
    if (!this.tree.hasOwnProperty('key')) return   // Empty tree

    const newTree = _delete(this, this.tree, key, value);

    // If newTree is undefined, that means its structure was not modified
    if (newTree) this.tree = newTree
  }

  // Insert in the internal tree, update the pointer to the root if needed
  insert(key, value) {
    // Empty tree, insert as root
    if (!this.tree.hasOwnProperty('key')) {
      this.tree.key = key;
      this.tree.push(value);
      this.tree.height = 1
      return
    }

    const newTree = _insert(this, this.tree, key, value);

    // If newTree is undefined, that means its structure was not modified
    if (newTree) this.tree = newTree
  }

  

  /**
   * Check that a tree is a BST as defined here (node ordering and pointer references)
   */
  checkIsBST() {
    this.checkNodeOrdering();
    this.tree.checkInternalPointers();
    if (this.tree.parent) { throw new Error("The root shouldn't have a parent"); }
  }


  checkIsAVLT() { 
    this.checkIsBST()
    this.tree.checkIsAVLT(); 
  }




  
  // ================================
  // Methods used to test the tree
  // ================================

  /**
   * Check that the core BST properties on node ordering are verified
   * Throw if they aren't
   */
  checkNodeOrdering() {
    if (!this.hasOwnProperty('key')) { return; }

    return _checkNodeOrdering(this, this.tree)
  }

  /**
   * Get the descendant with max key
   */
  getMaxKeyDescendant() {
    return _getMaxKeyDescendant(this.tree)
  }


  /**
   * Get the maximum key
   */
  getMaxKey() {
    return this.getMaxKeyDescendant().key;
  }


  /**
   * Get the descendant with min key
   */
  getMinKeyDescendant() {
    return _getMinKeyDescendant(this.tree)
  }


  /**
   * Get the minimum key
   */
  getMinKey() {
    return this.getMinKeyDescendant().key;
  }


  // ============================================
  // Methods used to actually work on the tree
  // ============================================


  /**
   * Search for all data corresponding to a key
   */
  search(key) {
    if (!this.tree.hasOwnProperty('key')) { return []; }
    
    return _search(this.compareKeys, this.tree, key)
  }

  /**
   * Search for data coming right after a specific key
   */
  searchAfter(key) {
    if (!this.tree.hasOwnProperty('key')) { return []; }

    return _searchAfter(this.compareKeys, this.tree, key)
  }

  /**
   * Search for data coming right before a specific key
   */
  searchBefore(key) {
    if (!this.tree.hasOwnProperty('key')) { return []; }

    return _searchBefore(this.compareKeys, this.tree, key)
  }

  /**
   * Search for all data corresponding to a specific key, if that key
   * does not exist, find the nearest key less than the specified key and its 
   * associated data. Returns null if no such key&data can be found.
  **/
  searchNearestLte(key) {
    if (!this.tree.hasOwnProperty('key')) { return null; }

    return _searchNearestLte(this.compareKeys, this.tree, key);
  }

  /**
   * Search for all data corresponding to a specific key, if that key
   * does not exist, find the nearest key greater than the specified key and its 
   * associated data. Returns null if no such key&data can be found.
  **/
  searchNearestGte(key) {
    if (!this.tree.hasOwnProperty('key')) { return null; }

    return _searchNearestGte(this.compareKeys, this.tree, key);
  }

  /**
   * Search for all data corresponding to a specific key, if that key
   * does not exist, find the nearest key and associated data.
   */
  searchNearest(key) {
    if (!this.tree.hasOwnProperty('key')) { return null; }

    return _searchNearest(this.compareKeys, this.tree, key);
  }

  /**
   * Return a function that tells whether a given key matches a lower bound
   */
  getLowerBoundMatcher(query) {
    // No lower bound
    if (!query.hasOwnProperty('$gt') && !query.hasOwnProperty('$gte')) {
      return ReturnAlways
    }

    return _getLowerBoundMatcher.call(this.compareKeys, query)
  }


  /**
   * Return a function that tells whether a given key matches an upper bound
   */
  getUpperBoundMatcher(query) {
    // No upper bound
    if (!query.hasOwnProperty('$lt') && !query.hasOwnProperty('$lte')) {
      return ReturnAlways
    }

    return _getUpperBoundMatcher.call(this.compareKeys, query)
  }

  /**
   * Get all data for a key between bounds
   * Return it in key order
   * @param {Object} query Mongo-style query where keys are $lt, $lte, $gt or $gte (other keys are not considered)
   * @param {Functions} lbm/ubm matching functions calculated at the first recursive step
   */
  betweenBounds(query) {
    if (!this.tree.hasOwnProperty('key')) return []   // Empty tree

    const lbm = this.getLowerBoundMatcher(query);
    const ubm = this.getUpperBoundMatcher(query);

    const res = [];
    _betweenBounds(this.tree, res, lbm, ubm)
    return res
  }
}


/**
 * Other functions we want to use on an AVLTree as if it were the internal _AVLTree
 */
['getNumberOfKeys', 'prettyPrint', 'executeOnEveryNode'].forEach(function (fn) {
  AVLTree.prototype[fn] = function () {
    return this.tree[fn].apply(this.tree, arguments);
  }
})


/**
 * Keep a pointer to the internal tree constructor for testing purposes
 */
AVLTree.AVLTreeNode = AVLTreeNode

// Interface
module.exports = AVLTree