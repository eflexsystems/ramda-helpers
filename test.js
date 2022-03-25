"use strict";
const { expect } = require("chai");
const { find, prop, into, map, compose } = require("ramda");
const {
  dp,
  dpEq,
  dpPluck,
  leftJoin,
  leftJoinAs,
  maxOf,
  minOf,
} = require("./index");
const { describe, it } = require("mocha");

describe("Ramda Extensions", function () {
  describe("leftJoin", function () {
    it("replaces the collectionKeys in the collection with the joined object", function () {
      const collection = [
        {
          a: "a",
          b: 2,
        },
        {
          a: "b",
          b: 3,
        },
        {
          a: "c",
          b: 4,
        },
      ];

      const joinedCollection = [
        {
          id: collection[0].a,
          b: 2,
        },
        {
          id: collection[2].a,
          b: 5,
        },
      ];

      const result = leftJoin("a", "id", joinedCollection, collection);

      expect(result).to.deep.equal([
        {
          a: {
            id: collection[0].a,
            b: 2,
          },
          b: 2,
        },
        {
          a: null,
          b: 3,
        },
        {
          a: {
            id: collection[2].a,
            b: 5,
          },
          b: 4,
        },
      ]);
    });

    it("works with ramda transducers", function () {
      const collection = [
        {
          a: "a",
          b: 2,
        },
        {
          a: "b",
          b: 3,
        },
        {
          a: "c",
          b: 4,
        },
      ];

      const joinedCollection = [
        {
          id: collection[0].a,
          b: 2,
        },
        {
          id: collection[2].a,
          b: 5,
        },
      ];

      const result = into(
        [],
        compose(
          leftJoin("a", "id", joinedCollection),
          map((item) => ({
            a: item.a,
          }))
        ),
        collection
      );

      expect(result).to.deep.equal([
        {
          a: {
            id: collection[0].a,
            b: 2,
          },
        },
        {
          a: null,
        },
        {
          a: {
            id: collection[2].a,
            b: 5,
          },
        },
      ]);
    });

    it("works with paths", function () {
      const id = "a";

      const collection = [
        {
          a: {
            derp: id,
          },
          b: 2,
        },
      ];

      const joinedCollection = [
        {
          herp: {
            id,
          },
          c: 2,
        },
      ];

      const result = leftJoin(
        "a.derp",
        "herp.id",
        joinedCollection,
        collection
      );

      expect(result).to.deep.equal([
        {
          a: {
            derp: {
              c: 2,
              herp: {
                id,
              },
            },
          },
          b: 2,
        },
      ]);
    });
  });

  describe("leftJoinAs", function () {
    it("can override collectionKey as the final joined property name", function () {
      const id = "a";

      const collection = [
        {
          a: id,
          b: 2,
        },
      ];

      const joinedCollection = [
        {
          id,
          c: 2,
        },
      ];

      const result = leftJoinAs(
        "a",
        "id",
        "derp",
        joinedCollection,
        collection
      );

      expect(result).to.deep.equal([
        {
          a: id,
          derp: {
            id,
            c: 2,
          },
          b: 2,
        },
      ]);
    });
  });

  describe("maxOf", function () {
    it("returns the largest property value of an array", function () {
      const collection = [
        {
          a: 2,
        },
        {
          a: 1,
        },
        {
          a: null,
        },
      ];

      const result = maxOf(prop("a"), collection);

      expect(result).to.equal(2);
    });

    it("returns null for empty arrays", function () {
      const collection = [];

      const result = maxOf(prop("a"), collection);

      expect(result).to.equal(null);
    });
  });

  describe("minOf", function () {
    it("returns the smallest property value of an array", function () {
      const collection = [
        {
          a: 2,
        },
        {
          a: 1,
        },
        {
          a: null,
        },
      ];

      const result = minOf(prop("a"), collection);

      expect(result).to.equal(1);
    });

    it("returns null for empty arrays", function () {
      const collection = [];

      const result = minOf(prop("a"), collection);

      expect(result).to.equal(null);
    });
  });

  describe("dp", function () {
    it("works with a plain object", function () {
      const obj = {
        a: {
          b: 1,
        },
      };

      const result = dp("a.b", obj);

      expect(result).to.equal(1);
    });

    it("works with arrays", function () {
      const objs = [
        {
          a: {
            b: 1,
          },
        },
        {
          a: {
            b: 2,
          },
        },
      ];

      const result = map(dp("a.b"), objs);

      expect(result).to.deep.equal([1, 2]);
    });
  });

  describe("dpEq", function () {
    it("works with a plain object", function () {
      const obj = {
        a: {
          b: 1,
        },
      };

      const result = dpEq("a.b", 1, obj);

      expect(result).to.be.true;
    });

    it("works with arrays", function () {
      const objs = [
        {
          a: {
            b: 1,
          },
        },
        {
          a: {
            b: 2,
          },
        },
      ];

      const result = find(dpEq("a.b", 2), objs);

      expect(result).to.equal(objs[1]);
    });
  });

  describe("dpPluck", function () {
    it("plucks a nested property from an array", function () {
      const objs = [
        {
          a: {
            b: 1,
          },
        },
        {
          a: {
            b: 2,
          },
        },
      ];

      const result = dpPluck("a.b", objs);

      expect(result).to.deep.equal([1, 2]);
    });
  });
});
