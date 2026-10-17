import test from "node:test";
import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
const originalStorage = globalThis.localStorage;
const values = new Map();

globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key)
};

const { api, ApiError, setToken } = await import("../src/services/api.js");

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  values.clear();
});

test.after(() => {
  globalThis.localStorage = originalStorage;
});

test("CRUD requests preserve backend messages, codes, and field details", async () => {
  const cases = [
    ["get", "/categories", undefined, "GET"],
    ["post", "/categories", { name: "New" }, "POST"],
    ["put", "/categories/7", { name: "Updated" }, "PUT"],
    ["patch", "/categories/7", { show_on_homepage: false }, "PATCH"],
    ["delete", "/categories/7", undefined, "DELETE"]
  ];

  for (const [method, path, body, expectedMethod] of cases) {
    let request;
    globalThis.fetch = async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({
        success: false,
        error: { code: "CONFLICT", message: "Category is still in use", details: [{ field: "name", message: "Already used" }] }
      }), { status: 409, headers: { "content-type": "application/json" } });
    };

    await assert.rejects(api[method](path, body), (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.message, "Category is still in use");
      assert.equal(error.code, "CONFLICT");
      assert.deepEqual(error.details, [{ field: "name", message: "Already used" }]);
      return true;
    });
    assert.equal(request.options.method, expectedMethod);
    assert.match(request.url, /\/api\/categories/);
  }
});

test("network and malformed server errors provide actionable messages", async () => {
  globalThis.fetch = async () => { throw new TypeError("Connection refused by test server"); };
  await assert.rejects(api.get("/dashboard"), /Could not reach the server: Connection refused by test server/);

  globalThis.fetch = async () => new Response("not json", { status: 502 });
  await assert.rejects(api.get("/dashboard"), /request failed with status 502/i);
});

test("401 responses preserve the backend message and clear the session", async () => {
  setToken("expired-token");
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Session expired, please sign in again" } }), {
    status: 401,
    headers: { "content-type": "application/json" }
  });
  await assert.rejects(api.get("/admin/dashboard/summary"), /Session expired, please sign in again/);
  assert.equal(localStorage.getItem("zmw_admin_token"), null);
});
