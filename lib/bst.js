/**
 * Simple binary search tree
 */
const customUtils = require('./customUtils');
const {_betweenBounds, _checkNodeOrdering, _delete, _getMaxKeyDescendant, _getMinKeyDescendant, _insert, _search, _searchAfter, _searchBefore, _searchNearest, _searchNearestGte, _searchNearestLte, _getLowerBoundMatcher, _getUpperBoundMatcher, ReturnAlways} = require('./common')


class BinarySearchTreeNode extends Array {
  constructor(options) {
    let data
    if(options.values) data = [...options.values]
    else if(options.hasOwnProperty('value')) data = [options.value]
    else data = []
    
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


  /**
   * Check that a tree is a BST as defined here (node ordering and pointer references)
   */
  checkIsBST() {
    this.checkNodeOrdering();
    this.checkInternalPointers();
    if (this.parent) { throw new Error("The root shouldn't have a parent"); }
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