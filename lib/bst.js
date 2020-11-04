/**
 * Simple binary search tree
 */
var customUtils = require('./customUtils');

function _betweenBounds(node, res, lbm, ubm) {
  let lRes = lbm(node.key)
  if (lRes && node.left) _betweenBounds(node.left, res, lbm, ubm)
  if (!ubm(node.key)) return
  if (lRes) {
    for (const r of node) {
      res.push(r)
    }
  }
  if (node.right) _betweenBounds(node.right, res, lbm, ubm)
}

function _insert(root, node, key, value) {
  // Empty tree, insert as root
  if (!node.hasOwnProperty('key')) {
    node.key = key;
    customUtils.isDef(value) && node.push(value);
    return;
  }

  // Same key as root
  const comparison = root.compareKeys(key, node.key)
  if (comparison === 0) {
    if (root.unique) {
      if (node.includes(value)) return
      var err = new Error("Can't insert key " + key + ", it violates the unique constraint");
      err.key = key;
      err.errorType = 'uniqueViolated';
      throw err;
    } else if (customUtils.isDef(value)) {
      if (root.vkUnique && node.includes(value)) return
      node.push(value);
    }
    return;
  }

  var childNode = { key: key };
  if (customUtils.isDef(value)) {
    childNode.value = value;
  }
  if (comparison < 0) {
    // Insert in left subtree
    if (node.left) {
      _insert(root, node.left, key, value);
    } else {
      node.createLeftChild(childNode);
    }
  } else {
    // Insert in right subtree
    if (node.right) {
      _insert(root, node.right, key, value);
    } else {
      node.createRightChild(childNode);
    }
  }
}

function _search(compareKeys, node, key) {
  const comparison = compareKeys(key, node.key)
  if (comparison === 0) { return node; }

  if (comparison < 0) {
    if (node.left) {
      return _search(compareKeys, node.left, key);
    }
    return [];
  }
  
  if (node.right) {
    return _search(compareKeys, node.right, key);
  } 
  
  return [];
}

function _searchAfter(compareKeys, node, key) {
  if (compareKeys(node.key, key) === 0) {
    // if there's a right child, the next key will be there
    var cur = node.right;
    if (cur) {
      // within the right branch, traverse left until leaf
      while (cur.left)
        cur = cur.left;
      return cur;
    }

    // traverse up until you find a bigger key
    cur = node.parent;
    while (cur) {
      if (compareKeys(key, cur.key) < 0)
        return cur;
      cur = cur.parent;
    }
    return [];
  }

  if (compareKeys(key, node.key) < 0) {
    if (node.left) {
      return _searchAfter(compareKeys, node.left, key);
    }
    return node;
  }

  if (node.right) {
    return _searchAfter(compareKeys, node.right, key);
  }
  // traverse up until you find a bigger key
  var cur = node.parent;
  while (cur) {
    if (compareKeys(key, cur.key) < 0)
      return cur;
    cur = cur.parent;
  }
  return [];
}

function _searchBefore(compareKeys, node, key) {
  if (compareKeys(node.key, key) === 0) {
    // if there's a left child, the previous key will be there
    var cur = node.left;
    if (cur) {
      // within the left branch, traverse right until leaf
      while (cur.right)
        cur = cur.right;
      return cur;
    }

    // traverse up until you find a smaller key
    cur = node.parent;
    while (cur) {
      if (compareKeys(key, cur.key) > 0)
        return cur;
      cur = cur.parent;
    }
    return [];
  }

  if (compareKeys(key, node.key) < 0) {
    if (node.left) {
      return _searchBefore(compareKeys, node.left, key);
    }

    // traverse up until you find a smaller key
    var cur = node.parent;
    while (cur) {
      if (compareKeys(key, cur.key) > 0)
        return cur;
      cur = cur.parent;
    }
    return [];
  }

  if (node.right) {
    return _searchBefore(compareKeys, node.right, key);
  }
  return node;
}

function _searchNearestLte(compareKeys, node, key, nearestSoFar) {
  var nearest = null;

  if (typeof nearestSoFar != 'undefined') {
    nearest = nearestSoFar;
  }

  if (compareKeys(key, node.key) === 0) {
    return node;
  }

  if ((nearest == null || Math.abs(compareKeys(node.key, key)) < Math.abs(compareKeys(key, nearest.key))) &&
    compareKeys(node.key, key) <= 0) {

    nearest = node;
  }

  if (compareKeys(key, node.key) < 0) {
    if (node.left) {
      const leftCandidate = _searchNearestLte(compareKeys, node.left, key, nearest);
      if (leftCandidate != null && (nearest == null || Math.abs(compareKeys(leftCandidate.key, key)) < Math.abs(compareKeys(key, nearest.key)))
        && compareKeys(leftCandidate.key, key) <= 0) {

        nearest = leftCandidate;
      }
    }
  }

  if (nearest == null || compareKeys(key, node.key) >= 0) {
    if (node.right) {
      const rightCandidate = _searchNearestLte(compareKeys, node.right, key, nearest);
      if (rightCandidate != null && (nearest == null || Math.abs(compareKeys(rightCandidate.key, key)) < Math.abs(compareKeys(key, nearest.key)))
        && compareKeys(rightCandidate.key, key) <= 0) {

        nearest = rightCandidate;
      }
    }
  }

  return nearest;
}

function _searchNearestGte(compareKeys, node, key, nearestSoFar) {

  var nearest = null;

  if (typeof nearestSoFar != 'undefined') {
    nearest = nearestSoFar;
  }

  if (compareKeys(key, node.key) === 0) {
    return node;
  }

  if ((nearest == null || Math.abs(compareKeys(node.key, key)) < Math.abs(compareKeys(key, nearest.key))) &&
    compareKeys(node.key, key) >= 0) {

    nearest = node;
  }

  if (compareKeys(key, node.key) < 0) {
    if (node.left) {
      const leftCandidate = _searchNearestGte(compareKeys, node.left, key, nearest);
      if (leftCandidate != null && (nearest == null || Math.abs(compareKeys(leftCandidate.key, key)) < Math.abs(compareKeys(key, nearest.key)))
        && compareKeys(leftCandidate.key, key) >= 0) {

        nearest = leftCandidate;
      }
    }
  }

  if (nearest == null || compareKeys(key, node.key) >= 0) {
    if (node.right) {
      const rightCandidate = _searchNearestGte(compareKeys, node.right, key, nearest);
      if (rightCandidate != null && (nearest == null || Math.abs(compareKeys(rightCandidate.key, key)) < Math.abs(compareKeys(key, nearest.key)))
        && compareKeys(rightCandidate.key, key) >= 0) {

        nearest = rightCandidate;
      }
    }
  }

  return nearest;
}

function _searchNearest(compareKeys, node, key, nearestSoFar) {

  var nearest = null;

  if (typeof nearestSoFar != 'undefined') {
    nearest = nearestSoFar;
  }

  if (compareKeys(key, node.key) === 0) {
    return node;
  }

  if (nearest == null ||
    Math.abs(compareKeys(node.key, key)) < Math.abs(compareKeys(key, nearest.key))) {

    nearest = node;
  }

  if (compareKeys(key, node.key) < 0) {
    if (node.left) {
      const leftCandidate = _searchNearest(compareKeys, node.left, key, nearest);
      if (leftCandidate != null && (nearest == null ||
        Math.abs(compareKeys(leftCandidate.key, key)) < Math.abs(compareKeys(key, nearest.key)))) {

        nearest = leftCandidate;
      }
    }
  } else {
    if (node.right) {
      const rightCandidate = _searchNearest(compareKeys, node.right, key, nearest);
      if (rightCandidate != null && (nearest == null ||
        Math.abs(compareKeys(rightCandidate.key, key)) < Math.abs(compareKeys(key, nearest.key)))) {

        nearest = rightCandidate;
      }
    }
  }

  return nearest;
}

function _delete(root, node, key, value) {
  var replaceWith;

  if (root.compareKeys(key, node.key) < 0) {
    if (node.left) _delete(root, node.left, key, value)
    return;
  }

  if (root.compareKeys(key, node.key) > 0) {
    if (node.right) _delete(root, node.right, key, value)
    return;
  }

  if (!root.compareKeys(key, node.key) === 0) { return; }

  // Delete only a value
  if (node.length > 1 && customUtils.isDef(value)) {
    node.replaceData(node.filter(d => {
      return !root.checkValueEquality(d, value);
    }))
    return;
  }

  // Delete the whole node
  if (node.deleteIfLeaf()) {
    return;
  }
  if (node.deleteIfOnlyOneChild()) {
    return;
  }

  // We are in the case where the node to delete has two children
  if (Math.random() >= 0.5) {   // Randomize replacement to avoid unbalancing the tree too much
    // Use the in-order predecessor
    replaceWith = _getMaxKeyDescendant(node.left);

    node.key = replaceWith.key;
    node.replaceData(replaceWith);

    if (node === replaceWith.parent) {   // Special case
      node.left = replaceWith.left;
      if (replaceWith.left) { replaceWith.left.parent = replaceWith.parent; }
    } else {
      replaceWith.parent.right = replaceWith.left;
      if (replaceWith.left) { replaceWith.left.parent = replaceWith.parent; }
    }
  } else {
    // Use the in-order successor
    replaceWith = _getMinKeyDescendant(node.right);

    node.key = replaceWith.key;
    node.replaceData(replaceWith);

    if (node === replaceWith.parent) {   // Special case
      node.right = replaceWith.right;
      if (replaceWith.right) { replaceWith.right.parent = replaceWith.parent; }
    } else {
      replaceWith.parent.left = replaceWith.right;
      if (replaceWith.right) { replaceWith.right.parent = replaceWith.parent; }
    }
  }
}

function _getMinKeyDescendant(node) {
  if (node.left) {
    return _getMinKeyDescendant(node.left)
  }

  return node
}


function _getMaxKeyDescendant(node) {
  if (node.right) {
    return _getMaxKeyDescendant(node.right);
  }
  return node
}

function _checkNodeOrdering(root, node){
  if (node.left) {
    node.left.checkAllNodesFullfillCondition(function (k) {
      if (root.compareKeys(k, node.key) >= 0) {
        throw new Error('Tree with root ' + self.key + ' is not a binary search tree');
      }
    });
    _checkNodeOrdering(root, node.left);
  }

  if (node.right) {
    node.right.checkAllNodesFullfillCondition(function (k) {
      if (root.compareKeys(k, node.key) <= 0) {
        throw new Error('Tree with root ' + self.key + ' is not a binary search tree');
      }
    });
    _checkNodeOrdering(root, node.right);
  }
}

class BinarySearchTreeNode extends Array {
  constructor(options) {
    let data = options.hasOwnProperty('value') ? [options.value] : [];
    super(...data)

    this.left = null;
    this.right = null;
    if (options.hasOwnProperty('key')) { this.key = options.key; }
    this.parent = options.parent !== undefined ? options.parent : null;
  }


  /**
   * Create a BST similar (i.e. same options except for key and value) to the current one
   * Use the same constructor (i.e. BinarySearchTree, AVLTree etc)
   * @param {Object} options see constructor
   */
  createSimilar(options) {
    return new BinarySearchTreeNode(options);
  }


  /**
   * Create the left child of this BST and return it
   */
  createLeftChild(options) {
    var leftChild = this.createSimilar(options);
    leftChild.parent = this;
    this.left = leftChild;

    return leftChild;
  }


  /**
   * Create the right child of this BST and return it
   */
  createRightChild(options) {
    var rightChild = this.createSimilar(options);
    rightChild.parent = this;
    this.right = rightChild;

    return rightChild;
  }


  /**
   * Delete the current node if it is a leaf
   * Return true if it was deleted
   */
  deleteIfLeaf() {
    if (this.left || this.right) { return false; }

    // The leaf is itself a root
    if (!this.parent) {
      delete this.key;
      this.splice(0, this.length)
      return true;
    }

    if (this.parent.left === this) {
      this.parent.left = null;
    } else {
      this.parent.right = null;
    }

    return true;
  }

  replaceData(what) {
    //console.log(what)
    if (this.length > what.length) this.splice(what.length, this.length - what.length)
    for (let i = what.length; i --; ) {
      this[i] = what[i]
    }
  }

  /**
   * Delete the current node if it has only one child
   * Return true if it was deleted
   */
  deleteIfOnlyOneChild() {
    var child;

    if (this.left && !this.right) child = this.left
    else if (!this.left && this.right) child = this.right
    if (!child) return false

    // Root
    if (!this.parent) {
      this.key = child.key;
      this.replaceData(child)

      this.left = null;
      if (child.left) {
        this.left = child.left;
        child.left.parent = this;
      }

      this.right = null;
      if (child.right) {
        this.right = child.right;
        child.right.parent = this;
      }

      return true;
    }

    if (this.parent.left === this) {
      this.parent.left = child;
      child.parent = this.parent;
    } else {
      this.parent.right = child;
      child.parent = this.parent;
    }

    return true;
  }



  /**
   * Execute a function on every node of the tree, in key order
   * @param {Function} fn Signature: node. Most useful will probably be node.key and node.data
   */
  executeOnEveryNode(fn) {
    if (this.left) { this.left.executeOnEveryNode(fn); }
    fn(this);
    if (this.right) { this.right.executeOnEveryNode(fn); }
  }


  /**
   * Pretty print a tree
   * @param {Boolean} printData To print the nodes' data along with the key
   */
  prettyPrint(printData, spacing) {
    spacing = spacing || "";

    console.log(spacing + "* " + this.key);
    if (printData) { console.log(spacing + "* " + super.toString()); }

    if (!this.left && !this.right) { return; }

    if (this.left) {
      this.left.prettyPrint(printData, spacing + "  ");
    } else {
      console.log(spacing + "  *");
    }
    if (this.right) {
      this.right.prettyPrint(printData, spacing + "  ");
    } else {
      console.log(spacing + "  *");
    }
  }

  
  /**
   * Check that all nodes (incl. leaves) fullfil condition given by fn
   * test is a function passed every (key, data) and which throws if the condition is not met
   */
  checkAllNodesFullfillCondition(test) {
    if (!this.hasOwnProperty('key')) { return; }

    test(this.key, this);
    if (this.left) { this.left.checkAllNodesFullfillCondition(test); }
    if (this.right) { this.right.checkAllNodesFullfillCondition(test); }
  }


  /**
   * Check that all pointers are coherent in this tree
   */
  checkInternalPointers() {
    if (this.left) {
      if (this.left.parent !== this) { throw new Error('Parent pointer broken for key ' + this.key); }
      this.left.checkInternalPointers();
    }

    if (this.right) {
      if (this.right.parent !== this) { throw new Error('Parent pointer broken for key ' + this.key); }
      this.right.checkInternalPointers();
    }
  }


  /**
   * Check that a tree is a BST as defined here (node ordering and pointer references)
   */
  checkIsBST() {
    this.checkNodeOrdering();
    this.checkInternalPointers();
    if (this.parent) { throw new Error("The root shouldn't have a parent"); }
  }


  /**
   * Get number of keys inserted
   */
  getNumberOfKeys() {
    var res;

    if (!this.hasOwnProperty('key')) { return 0; }

    res = 1;
    if (this.left) { res += this.left.getNumberOfKeys(); }
    if (this.right) { res += this.right.getNumberOfKeys(); }

    return res;
  }
}


function _getLowerBoundMatcher(query){
  if (query.hasOwnProperty('$gt') && query.hasOwnProperty('$gte')) {
    if (this(query.$gte, query.$gt) === 0) {
      const q = query.$gt
      return (key) => { return this(key, q) > 0; };
    }

    if (this(query.$gte, query.$gt) > 0) {
      const q = query.$gte
      return (key) => { return this(key, q) >= 0; };
    }
    
    const q = query.$gt
    return (key) => { return this(key, q) > 0; };
  }

  if (query.hasOwnProperty('$gt')) {
    const q = query.$gt
    return (key) => { return this(key, q) > 0; };
  }

  const q = query.$gte
  return (key) => { return this(key, q) >= 0; };
}

function _getUpperBoundMatcher(query){
  if (query.hasOwnProperty('$lt') && query.hasOwnProperty('$lte')) {
    if (this(query.$lte, query.$lt) === 0) {
      const q = query.$lt
      return (key) => { return this(key, q) < 0; };
    }

    if (this(query.$lte, query.$lt) < 0) {
      const q = query.$lte
      return (key) => { return this(key, q) <= 0; };
    }

    const q = query.$lt
    return (key) => { return this(key, q) < 0; };
  }

  if (query.hasOwnProperty('$lt')) {
    const q = query.$lt
    return (key) => { return this(key, q) < 0; };
  }

  const q = query.$lte
  return (key) => { return this(key, q) <= 0; }
}

const ReturnAlways = () => true

class BinarySearchTree extends BinarySearchTreeNode {
  /**
   * Constructor
   * @param {Object} options Optional
   * @param {Boolean}  options.unique Whether to enforce a 'unique' constraint on the key or not
   * @param {Key}      options.key Initialize this BST's key with key
   * @param {Value}    options.value Initialize this BST's data with [value]
   * @param {Function} options.compareKeys Initialize this BST's compareKeys
   */
  constructor(options) {
    options = options || {};
    super(options)

    this.unique = options.unique || false;
    this.vkUnique = options.vkUnique || false;

    this.compareKeys = options.compareKeys || customUtils.defaultCompareKeysFunction;
    this.checkValueEquality = options.checkValueEquality || customUtils.defaultCheckValueEquality;
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

    return _checkNodeOrdering(this, this)
  }

  /**
   * Get the descendant with max key
   */
  getMaxKeyDescendant() {
    return _getMaxKeyDescendant(this)
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
    return _getMinKeyDescendant(this)
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
   * Insert a new element
   * @param {Key} key
   * @param {Value=} value Optional
   */
  insert(key, value) {
    _insert(this, this, key, value)
  }


  /**
   * Search for all data corresponding to a key
   */
  search(key) {
    if (!this.hasOwnProperty('key')) { return []; }

    return _search(this.compareKeys, this, key)
  }

  /**
   * Search for data coming right after a specific key
   */
  searchAfter(key) {
    if (!this.hasOwnProperty('key')) { return []; }

    return _searchAfter(this.compareKeys, this, key)
  }

  /**
   * Search for data coming right before a specific key
   */
  searchBefore(key) {
    if (!this.hasOwnProperty('key')) { return []; }

    return _searchBefore(this.compareKeys, this, key)
  }

  /**
   * Search for all data corresponding to a specific key, if that key
   * does not exist, find the nearest key less than the specified key and its 
   * associated data. Returns null if no such key&data can be found.
  **/
  searchNearestLte(key) {
    if (!this.hasOwnProperty('key')) { return null; }

    return _searchNearestLte(this.compareKeys, this, key);
  }

  /**
   * Search for all data corresponding to a specific key, if that key
   * does not exist, find the nearest key greater than the specified key and its 
   * associated data. Returns null if no such key&data can be found.
  **/
  searchNearestGte(key) {
    if (!this.hasOwnProperty('key')) { return null; }

    return _searchNearestGte(this.compareKeys, this, key);
  }

  /**
   * Search for all data corresponding to a specific key, if that key
   * does not exist, find the nearest key and associated data.
   */
  searchNearest(key) {
    if (!this.hasOwnProperty('key')) { return null; }

    return _searchNearest(this.compareKeys, this, key);
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
    // No lower bound
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
    if (!this.hasOwnProperty('key')) return []   // Empty tree

    const lbm = this.getLowerBoundMatcher(query);
    const ubm = this.getUpperBoundMatcher(query);

    const res = [];
    _betweenBounds(this, res, lbm, ubm)
    return res
  }




  /**
   * Delete a key or just a value
   * @param {Key} key
   * @param {Value=} value Optional. If not set, the whole key is deleted. If set, only this value is deleted
   */
  delete(key, value) {
    if (!this.hasOwnProperty('key')) { return; }

    return _delete(this, this, key, value)
  }

  *yieldOnEveryNode() {
    const queue = []
    let q = this
    while (q !== undefined) {
      if (q.a) {
        yield q.a
      } else {
        if (q.right) queue.push(q.right, { a: q })
        else queue.push({ a: q })
        if (q.left) {
          q = q.left
          continue
        }
      }
      q = queue.pop()
    }
  }
}

BinarySearchTree.Node = BinarySearchTreeNode

// Interface
module.exports = BinarySearchTree;