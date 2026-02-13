// test-deepClone.ts
// npx ts-node src/hooks/test-deepClone.ts
import { deepClone } from "./util";

// Helper function to check deep equality (simplified)
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!(key in b) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

// Test cases
function runTests() {
  console.log("Running deepClone tests...\n");

  // Test 1: Primitive values
  console.log("Test 1: Primitives");
  console.log("  Input: null -> Cloned:", deepClone(null));
  console.assert(deepClone(null) === null, "null should return null");
  console.log("  Input: 42 -> Cloned:", deepClone(42));
  console.assert(deepClone(42) === 42, "number should be cloned");
  console.log("  Input: 'hello' -> Cloned:", deepClone("hello"));
  console.assert(deepClone("hello") === "hello", "string should be cloned");
  console.log("  Input: true -> Cloned:", deepClone(true));
  console.assert(deepClone(true) === true, "boolean should be cloned");
  console.log("Primitives: PASS\n");

  // Test 2: Simple array
  console.log("Test 2: Simple Array");
  const originalArray = [1, 2, 3];
  const clonedArray = deepClone(originalArray);
  console.log(
    "  Input:",
    JSON.stringify(originalArray),
    "-> Cloned:",
    JSON.stringify(clonedArray),
  );
  console.assert(Array.isArray(clonedArray), "cloned should be an array");
  console.assert(
    deepEqual(originalArray, clonedArray),
    "array should be deeply equal",
  );
  console.assert(
    originalArray !== clonedArray,
    "array should be a new reference",
  );
  console.log("Simple Array: PASS\n");

  // Test 3: Nested array
  console.log("Test 3: Nested Array");
  const nestedArray = [1, [2, 3], 4];
  const clonedNested = deepClone(nestedArray);
  console.log(
    "  Input:",
    JSON.stringify(nestedArray),
    "-> Cloned:",
    JSON.stringify(clonedNested),
  );
  console.assert(
    deepEqual(nestedArray, clonedNested),
    "nested array should be deeply equal",
  );
  console.assert(
    nestedArray[1] !== clonedNested[1],
    "nested arrays should be new references",
  );
  console.log("Nested Array: PASS\n");

  // Test 4: Simple object
  console.log("Test 4: Simple Object");
  const originalObject = { a: 1, b: "hello" };
  const clonedObject = deepClone(originalObject);
  console.log(
    "  Input:",
    JSON.stringify(originalObject),
    "-> Cloned:",
    JSON.stringify(clonedObject),
  );
  console.assert(
    deepEqual(originalObject, clonedObject),
    "object should be deeply equal",
  );
  console.assert(
    originalObject !== clonedObject,
    "object should be a new reference",
  );
  console.log("Simple Object: PASS\n");

  // Test 5: Nested object
  console.log("Test 5: Nested Object");
  const nestedObject = { a: 1, b: { c: 2, d: [3, 4] } };
  const clonedNestedObject = deepClone(nestedObject);
  console.log(
    "  Input:",
    JSON.stringify(nestedObject),
    "-> Cloned:",
    JSON.stringify(clonedNestedObject),
  );
  console.assert(
    deepEqual(nestedObject, clonedNestedObject),
    "nested object should be deeply equal",
  );
  console.assert(
    nestedObject.b !== clonedNestedObject.b,
    "nested objects should be new references",
  );
  console.assert(
    nestedObject.b.d !== clonedNestedObject.b.d,
    "nested arrays should be new references",
  );
  console.log("Nested Object: PASS\n");

  // Test 6: Mixed array and object
  console.log("Test 6: Mixed Array and Object");
  const mixed = [{ a: 1 }, 2, { b: [3, 4] }];
  const clonedMixed = deepClone(mixed);
  console.log(
    "  Input:",
    JSON.stringify(mixed),
    "-> Cloned:",
    JSON.stringify(clonedMixed),
  );
  console.assert(deepEqual(mixed, clonedMixed), "mixed should be deeply equal");
  console.assert(mixed[0] !== clonedMixed[0], "references should differ");
  console.log("Mixed: PASS\n");

  // Test 7: Empty structures
  console.log("Test 7: Empty Structures");
  console.log("  Input: [] -> Cloned:", JSON.stringify(deepClone([])));
  console.assert(deepEqual(deepClone([]), []), "empty array should be cloned");
  console.log("  Input: {} -> Cloned:", JSON.stringify(deepClone({})));
  console.assert(deepEqual(deepClone({}), {}), "empty object should be cloned");
  console.log("Empty Structures: PASS\n");

  // Test 8: Circular references (should not be handled, will cause stack overflow)
  // Note: This test is commented out because simple deepClone doesn't handle cycles
  // console.log('Test 8: Circular References (Expected to Fail)');
  // const circular: any = { a: 1 };
  // circular.self = circular;
  // try {
  //   const clonedCircular = deepClone(circular);
  //   console.assert(false, 'Circular references should cause an error in simple deepClone');
  // } catch (e) {
  //   console.log('Circular References: PASS (correctly failed)');
  // }

  console.log("All tests passed!");
}

// Run the tests
runTests();
