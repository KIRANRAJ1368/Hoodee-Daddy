const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
let existing, created, mailCount, failCreate;
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (parent?.filename.endsWith('leadController.js')) {
    if (request === '../models') return {
      VisitorLead: {
        findOne: async ({ where }) => existing?.phone === where.phone ? existing : null,
        create: async payload => { if (failCreate) throw Error('Database unavailable'); created.push(payload); return { id: 9, created_at: new Date(), save: async () => {} }; }
      },
      AdminUser: { findOne: async () => ({ email: 'admin@example.test' }) }
    };
    if (request === '../utils/mailer') return { sendFirstVisitLeadNotification: async () => { mailCount++; return { success: false }; } };
    if (request === '../config/env') return { seedAdmin: { email: 'admin@example.test' } };
  }
  return originalLoad.apply(this, arguments);
};
const { submitLead } = require('../src/controllers/leadController');
Module._load = originalLoad;
beforeEach(() => { existing = null; created = []; mailCount = 0; failCreate = false; });
function request(body = {}) { return { body: { phone: '9876543210', pincode: '641004', district: 'Coimbatore', state: 'Tamil Nadu', ...body }, headers: {}, socket: { remoteAddress: '127.0.0.1' } }; }
function response() { return { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }

test('new visitor saves once and returns a successful registration response', async () => {
  const res = response(); await submitLead(request(), res);
  assert.equal(res.statusCode, 201); assert.equal(res.body.data.is_existing, false);
  assert.equal(created.length, 1); assert.equal(mailCount, 1);
});
test('returning phone is recognized without duplicating leads or notification emails', async () => {
  existing = { id: 7, phone: '9876543210', pincode: '110001', district: 'Private district' };
  const res = response(); await submitLead(request(), res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.data.is_existing, true);
  assert.equal(created.length, 0); assert.equal(mailCount, 0);
  assert.equal(res.body.data.pincode, '641004');
  assert.equal(res.body.data.district, 'Coimbatore');
  assert.equal(res.body.data.token, undefined);
});
test('invalid mobile and PIN are rejected before registration', async () => {
  for (const body of [{ phone: '1234567890' }, { phone: '919876543210' }, { pincode: '000000' }, { pincode: '12345' }]) {
    await assert.rejects(() => submitLead(request(body), response()), /valid/);
  }
  assert.equal(created.length, 0); assert.equal(mailCount, 0);
});
test('database failure cannot produce a success response', async () => {
  failCreate = true; const res = response();
  await assert.rejects(() => submitLead(request(), res), /Database unavailable/);
  assert.equal(res.body, undefined); assert.equal(mailCount, 0);
});
