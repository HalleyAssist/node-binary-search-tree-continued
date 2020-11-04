const customUtils = require('./customUtils');

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
  
    if (nearestSoFar !== undefined) {
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
  
    if (nearestSoFar !== undefined) {
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
  
    if (nearestSoFar !== undefined) {
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

  module.exports = {_betweenBounds, _checkNodeOrdering, _delete, _getMaxKeyDescendant, _getMinKeyDescendant, _insert, _search, _searchAfter, _searchBefore, _searchNearest, _searchNearestGte, _searchNearestLte, _getLowerBoundMatcher, _getUpperBoundMatcher, ReturnAlways}