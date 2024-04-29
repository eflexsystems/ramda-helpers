import { expect } from "chai";
import { find, prop, into, map, compose } from "ramda";
import { describe, it } from "mocha";
import {
  dp,
  dpEq,
  dpOr,
  dpPluck,
  intoArray,
  invokeMap,
  leftJoin,
  maxOf,
  minOf,
  upperFirst,
} from "./index.js";

describe("leftJoin", function () {
  it("returns an array of tuples with the joined objects", function () {
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

    const result = leftJoin("id", joinedCollection, "a", collection);

    expect(result).to.deep.equal([
      [
        {
          a: "a",
          b: 2,
        },
        {
          id: collection[0].a,
          b: 2,
        },
      ],
      [
        {
          a: "b",
          b: 3,
        },
        null,
      ],
      [
        {
          a: "c",
          b: 4,
        },
        {
          id: collection[2].a,
          b: 5,
        },
      ],
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
        leftJoin("id", joinedCollection, "a"),
        map(([item, joined]) => ({
          item,
          joined,
        })),
      ),
      collection,
    );

    expect(result).to.deep.equal([
      {
        item: {
          a: "a",
          b: 2,
        },
        joined: {
          id: "a",
          b: 2,
        },
      },
      {
        item: {
          a: "b",
          b: 3,
        },
        joined: null,
      },
      {
        item: {
          a: "c",
          b: 4,
        },
        joined: {
          id: "c",
          b: 5,
        },
      },
    ]);
  });

  it("works with paths", function () {
    const collection = [
      {
        b: 2,
        a: {
          derp: "a",
        },
      },
    ];

    const joinedCollection = [
      {
        c: 2,
        herp: {
          id: "a",
        },
      },
    ];

    const result = leftJoin("herp.id", joinedCollection, "a.derp", collection);

    expect(result).to.deep.equal([
      [
        {
          b: 2,
          a: {
            derp: "a",
          },
        },
        {
          c: 2,
          herp: {
            id: "a",
          },
        },
      ],
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

    const result = dpEq(1, "a.b", obj);

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

    const result = find(dpEq(2, "a.b"), objs);

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

describe("dpOr", function () {
  it("returns a nested property of an object if that property has a value", function () {
    const obj = {
      a: {
        b: 1,
      },
    };

    const result = dpOr(2, "a.b", obj);

    expect(result).to.equal(1);
  });

  it("returns the default value if a nested property of an object is null", function () {
    const obj = {
      a: {
        b: null,
      },
    };

    const result = dpOr(2, "a.b", obj);

    expect(result).to.equal(2);
  });

  it("returns the default value if a nested property of an object is undefined", function () {
    const obj = {
      a: {
        b: undefined,
      },
    };

    const result = dpOr(2, "a.b", obj);

    expect(result).to.equal(2);
  });

  it("returns the default value if a nested property of an object is not present", function () {
    const obj = {
      a: {},
    };

    const result = dpOr(2, "a.b", obj);

    expect(result).to.equal(2);
  });
});

describe("invokeMap", function () {
  it("plucks a nested property from an array", function () {
    const objs = [
      {
        test() {
          return "a";
        },
      },
      {
        test() {
          return "b";
        },
      },
    ];

    const result = invokeMap("test", objs);

    expect(result).to.deep.equal(["a", "b"]);
  });
});

describe("upperFirst", function () {
  it("uppercases the first letter of a string", function () {
    const result = upperFirst("test");

    expect(result).to.equal("Test");
  });
});

describe("intoArray", function () {
  it("is a shorthand for into([], compose(), arr ?? [])", function () {
    const result = intoArray(
      map((i) => i + 1),
      map((i) => i * 2),
    )([1, 2]);

    expect(result).to.deep.equal([4, 6]);
  });
});
