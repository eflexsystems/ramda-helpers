import {
  compose,
  curry,
  forEach,
  identity,
  into,
  invoker,
  join,
  lensIndex,
  map,
  over,
  path,
  pathEq,
  pathOr,
  reduce,
  split,
  toUpper,
  useWith,
} from "ramda";

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
export const dp = useWith(path, [dotSplitter]);

/**
 * Retrieve the value at a given nested dotted path if it has a value otherwise return the default value.
 *
 * @func
 * @param {*} default The default value
 * @param {String} path The dotted path to use.
 * @param {Object} obj The object to retrieve the nested property from.
 * @return {*} The data at `path` if it has a value otherwise the default value.
 * @example
 *
 * dpOr(1, "a.b", {a: {b: 2}}); //=> 2
 * dpOr(1, "a.b.", {c: {b: 2}}); //=> undefined
 * dpOr(1, "a.b.1", {a: {b: [1, 2, 3]}}); //=> 2
 * dpOr(1, "a.b.-2", {a: {b: [1, 2, 3]}}); //=> 2
 */
export const dpOr = useWith(pathOr, [identity, dotSplitter]);

/**
 * Determines whether a dotted path on an object has a specific value, in
 * [`R.equals`](#equals) terms. Most likely used to filter a list.
 *
 * @func
 * @param {*} val The value to compare the nested property with
 * @param {String} path The dotted path of the nested property to use
 * @param {Object} obj The object to check the nested property in
 * @return {Boolean} `true` if the value equals the nested object property,
 *         `false` otherwise.
 * @example
 *
 * const user1 = { address: { zipCode: 90210 } };
 * const user2 = { address: { zipCode: 55555 } };
 * const user3 = { name: 'Bob' };
 * const users = [ user1, user2, user3 ];
 * const isFamous = dpEq(90210, 'address.zipCode');
 * R.filter(isFamous, users); //=> [ user1 ]
 *
 */
export const dpEq = useWith(pathEq, [identity, dotSplitter]);

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
export const dpPluck = useWith(map, [dp]);

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
export const leftJoin = curry(
  (rightComparedPath, rightCollection, leftComparedPath, leftCollection) => {
    const hashMap = new Map();

    forEach((item) => {
      const key = dp(rightComparedPath, item);
      if (key) {
        hashMap.set(String(key), item);
      }
    }, rightCollection);

    return map((item) => [
      item,
      hashMap.get(String(dp(leftComparedPath, item))) ?? null,
    ])(leftCollection);
  },
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
export const maxOf = curry((func, collection) =>
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
    collection,
  ),
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
export const minOf = curry((func, collection) =>
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
    collection,
  ),
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
export const invokeMap = useWith(map, [invoker(0)]);

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
export const upperFirst = compose(join(""), over(lensIndex(0), toUpper));

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
export const intoArray = (...args) => into([], compose(...args));
