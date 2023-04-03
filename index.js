"use strict";
const {
  assocPath,
  compose,
  curry,
  forEach,
  invoker,
  join,
  lensIndex,
  map,
  over,
  path,
  pathEq,
  reduce,
  split,
  toUpper,
  useWith,
  identity,
  into,
} = require("ramda");

const dotSplitter = split(".");

/**
 * Retrieve the value at a given nested dotted path.
 *
 * @func
 * @param {String} path The dotted path to use.
 * @param {Object} obj The object to retrieve the nested property from.
 * @return {*} The data at `path`.
 * @example
 *
 * dp("a.b", {a: {b: 2}}); //=> 2
 * dp("a.b.", {c: {b: 2}}); //=> undefined
 * dp("a.b.0", {a: {b: [1, 2, 3]}}); //=> 1
 * dp("a.b.-2", {a: {b: [1, 2, 3]}}); //=> 2
 */
exports.dp = useWith(path, [dotSplitter]);

/**
 * Determines whether a dotted path on an object has a specific value, in
 * [`R.equals`](#equals) terms. Most likely used to filter a list.
 *
 * @func
 * @param {String} path The dotted path of the nested property to use
 * @param {*} val The value to compare the nested property with
 * @param {Object} obj The object to check the nested property in
 * @return {Boolean} `true` if the value equals the nested object property,
 *         `false` otherwise.
 * @example
 *
 * const user1 = { address: { zipCode: 90210 } };
 * const user2 = { address: { zipCode: 55555 } };
 * const user3 = { name: 'Bob' };
 * const users = [ user1, user2, user3 ];
 * const isFamous = dpEq('address.zipCode', 90210);
 * R.filter(isFamous, users); //=> [ user1 ]
 *
 */
exports.dpEq = useWith(pathEq, [identity, dotSplitter]);

/**
 * Makes a shallow clone of an object, setting or overriding the nodes required
 * to create the given dotted path, and placing the specific value at the tail end of
 * that dotted path. Note that this copies and flattens prototype properties onto the
 * new object as well. All non-primitive properties are copied by reference.
 *
 * @func
 * @param {String} path The dotted path to set
 * @param {*} val The new value
 * @param {Object} obj The object to clone
 * @return {Object} A new object equivalent to the original except along the specified dotted path.
 * @example
 *
 * assocDp('a.b.c', 42, {a: {b: {c: 0}}}); //=> {a: {b: {c: 42}}}
 *
 * // Any missing or non-object keys in path will be overridden
 * assocDp('a.b.c', 42, {a: 5}); //=> {a: {b: {c: 42}}}
 *
 */
exports.assocDp = useWith(assocPath, [dotSplitter]);

/**
 * Returns a new list by plucking the same dotted path off all objects in
 * the list supplied.
 *
 * `pluck` will work on
 * any [functor](https://github.com/fantasyland/fantasy-land#functor) in
 * addition to arrays, as it is equivalent to `R.map(dp(k), f)`.
 *
 * @func
 * @param {String} key The dotted path to pluck off of each object.
 * @param {Array} f The array or functor to consider.
 * @return {Array} The list of values for the given key.
 * @example
 *
 * dpPluck('name.first', [{name: { first: 'fred' }}, {name: { first: 'wilma'} }]); //=> ['fred', 'wilma']
 *
 */
exports.dpPluck = useWith(map, [exports.dp]);

/**
 * Returns a list of tuples where the first item is the original item from the leftCollection
 * and the second is is the object from the rightCollection that has a rightComparedPath value equal to the value at leftComparedPath
 *
 * @func
 * @param {String} rightComparedPath The dotted path to compare to leftComparedPath on each rightCollection object.
 * @param {Array} rightCollection The right side of the join
 * @param {String} leftComparedPath The dotted path to compare on each leftCollection object.
 * @param {Array} leftCollection The left side of the join
 * @return {Array} A list of tuples where the first item is the original item from the leftCollection and the second is the joined item
 * @example
 *
 * const leftCollection = [{ a: "a", b: 2 }];
 * const rightCollection = [{ id: "a", c: 2 }];
 * const result = leftJoin("id", rightCollection, "a", leftCollection); //=> [[{ a: "a", b: 2 }, { id: "a", c: 2 }]]
 *
 */
exports.leftJoin = curry(
  (rightComparedPath, rightCollection, leftComparedPath, leftCollection) => {
    const hashMap = new Map();

    forEach((item) => {
      const key = exports.dp(rightComparedPath, item);
      if (key) {
        hashMap.set(String(key), item);
      }
    }, rightCollection);

    return map((item) => [
      item,
      hashMap.get(String(exports.dp(leftComparedPath, item))) ?? null,
    ])(leftCollection);
  }
);

/**
 * Returns the largest value for a function applied to a collection of objects
 *
 * @func
 * @param {Function} func The function to apply to each object in the collection.
 * @param {Array} collection The collection to check
 * @return {Number} The largest value returned by applying func to each object in collection.
 * @example
 *
 * maxOf(prop("a"), [{ a: 2 }, { a: 1 }, { a: null }]); //=> 2
 *
 */
exports.maxOf = curry((func, collection) =>
  reduce(
    (largest, curr) => {
      const val = func(curr);

      if (val != null && (largest == null || val > largest)) {
        return val;
      } else {
        return largest;
      }
    },
    null,
    collection
  )
);

/**
 * Returns the smallest value for a function applied to a collection of objects
 *
 * @func
 * @param {Function} func The function to apply to each object in the collection.
 * @param {Array} collection The collection to check
 * @return {Number} The smallest value returned by applying func to each object in collection.
 * @example
 *
 * minOf(prop("a"), [{ a: 2 }, { a: 1 }, { a: null }]); //=> 1
 *
 */
exports.minOf = curry((func, collection) =>
  reduce(
    (smallest, curr) => {
      const val = func(curr);

      if (val != null && (smallest == null || val < smallest)) {
        return val;
      } else {
        return smallest;
      }
    },
    null,
    collection
  )
);

/**
 * Invokes a function on each object in a collection and returns each result
 *
 * @func
 * @param {Function} func The function to invoke on each object in the collection.
 * @param {Array} collection The collection to invoke
 * @return {*} An array of each result of invoking func on each item in collection
 * @example
 *
 * const objs = [{ test() { return "a" } }, { test() { return "b" } }];
 * invokeMap("test", objs); //=> ["a", "b"]
 *
 */
exports.invokeMap = useWith(map, [invoker(0)]);

/**
 * Uppercases the first letter of a string
 *
 * @func
 * @param {String} str The string to uppercase the first letter of
 * @return {String} The input string with its first letter uppercased
 * @example
 *
 * upperFirst("test"); //=> "Test"
 *
 */
exports.upperFirst = compose(join(""), over(lensIndex(0), toUpper));

/**
 * Is a shorthand for into([], compose(), arr ?? [])
 *
 * @func
 * @param {Array} transformedArray The array to transform
 * @param {Function[]} transformers A list of functions to transform the input array
 * @return {Array} The transformed input array
 * @example
 *
 * intoArray(map(i => i + 1), map(i => i * 2), [1, 2])
 *
 */
exports.intoArray = (...args) => into([], compose(...args));
