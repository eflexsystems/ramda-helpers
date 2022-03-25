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
} = require("ramda");

exports.dp = useWith(path, [split(".")]);
exports.dpEq = useWith(pathEq, [split(".")]);
exports.assocDp = useWith(assocPath, [split(".")]);

exports.dpPluck = curry((field, array) => map(exports.dp(field), array));

exports.leftJoinAs = curry(
  (collectionPath, joinedPath, propPath, joinedCollection, collection) => {
    const hashMap = new Map();

    forEach((item) => {
      const key = exports.dp(joinedPath, item);
      if (key) {
        hashMap.set(String(key), item);
      }
    }, joinedCollection);

    return map((item) =>
      exports.assocDp(
        propPath,
        hashMap.get(String(exports.dp(collectionPath, item))) ?? null,
        item
      )
    )(collection);
  }
);

exports.leftJoin = curry(
  (collectionPath, joinedPath, joinedCollection, collection) =>
    exports.leftJoinAs(
      collectionPath,
      joinedPath,
      collectionPath,
      joinedCollection,
      collection
    )
);

exports.maxOf = curry((func, collection) => {
  const result = reduce(
    (largest, curr) => {
      const val = func(curr);

      if (val != null && val > largest) {
        return val;
      } else {
        return largest;
      }
    },
    -Infinity,
    collection
  );

  if (result === -Infinity) {
    return null;
  } else {
    return result;
  }
});

exports.minOf = curry((func, collection) => {
  const result = reduce(
    (smallest, curr) => {
      const val = func(curr);

      if (val != null && val < smallest) {
        return val;
      } else {
        return smallest;
      }
    },
    Infinity,
    collection
  );

  if (result === Infinity) {
    return null;
  } else {
    return result;
  }
});

exports.invokeMap = curry((funcName, collection) =>
  map(invoker(0, funcName), collection)
);

exports.upperFirst = compose(join(""), over(lensIndex(0), toUpper));
