const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApi, SKIP } = require('./helpers');

const DAY = '2026-01-05'; // a fixed date in the past
const tomorrowPlus = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

describe('API: readings', { skip: SKIP }, () => {
  let api;
  before(async () => { api = await startApi(); });
  after(async () => { await api.stop(); });

  const add = (token, body) => api.call('POST', '/readings', { token, body });

  test('adds a reading and lists it for that date', async () => {
    const { token } = await api.registerUser();
    const created = await add(token, { date: DAY, slot: 'morning', value: 95 });
    assert.equal(created.status, 201);
    assert.deepEqual({ ...created.data, id: undefined }, { id: undefined, date: DAY, slot: 'morning', value: 95 });

    const list = await api.call('GET', `/readings?date=${DAY}`, { token });
    assert.equal(list.status, 200);
    assert.equal(list.data.total, 1);
    assert.equal(list.data.readings[0].value, 95);
  });

  test('validation: every rule returns its message with status 400', async () => {
    const { token } = await api.registerUser();
    const check = async (body, message) => {
      const res = await add(token, { date: DAY, slot: 'morning', value: 100, ...body });
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.data.error, message, JSON.stringify(body));
    };
    await check({ value: '' }, 'Please enter a glucose value.');
    await check({ value: null }, 'Please enter a glucose value.');
    await check({ value: 39 }, 'Value must be between 40 and 600 mg/dl.');
    await check({ value: 601 }, 'Value must be between 40 and 600 mg/dl.');
    await check({ value: 100.5 }, 'Value must be between 40 and 600 mg/dl.');
    await check({ value: 'abc' }, 'Value must be between 40 and 600 mg/dl.');
    await check({ date: tomorrowPlus(2) }, 'Date cannot be in the future.');
    await check({ date: '2026-02-31' }, 'Please choose a valid date.');
    await check({ slot: 'midnight' }, 'Please choose a time slot.');
  });

  test('the limits 40 and 600 are accepted', async () => {
    const { token } = await api.registerUser();
    assert.equal((await add(token, { date: DAY, slot: 'morning', value: 40 })).status, 201);
    assert.equal((await add(token, { date: DAY, slot: 'after_lunch', value: 600 })).status, 201);
  });

  test('only one reading per slot per day', async () => {
    const { token } = await api.registerUser();
    await add(token, { date: DAY, slot: 'after_lunch', value: 140 });
    const dup = await add(token, { date: DAY, slot: 'after_lunch', value: 150 });
    assert.equal(dup.status, 409);
    assert.equal(dup.data.error, 'You already have an After lunch reading for this date.');

    const morning = await add(token, { date: DAY, slot: 'morning', value: 90 });
    assert.equal(morning.status, 201);
    const dupMorning = await add(token, { date: DAY, slot: 'morning', value: 91 });
    assert.equal(dupMorning.data.error, 'You already have a Morning (fasting) reading for this date.');
  });

  test('the same slot is fine on a different day', async () => {
    const { token } = await api.registerUser();
    assert.equal((await add(token, { date: '2026-01-05', slot: 'morning', value: 90 })).status, 201);
    assert.equal((await add(token, { date: '2026-01-06', slot: 'morning', value: 92 })).status, 201);
  });

  test('maximum 4 readings per day', async () => {
    const { token } = await api.registerUser();
    for (const slot of ['morning', 'after_breakfast', 'after_lunch', 'after_dinner']) {
      assert.equal((await add(token, { date: DAY, slot, value: 110 })).status, 201);
    }
    const fifth = await add(token, { date: DAY, slot: 'morning', value: 111 });
    assert.equal(fifth.status, 409);
    assert.equal(fifth.data.error, 'You can add only 4 readings per day.');
  });

  test('editing changes the value, and cannot take a slot that is already used', async () => {
    const { token } = await api.registerUser();
    const morning = (await add(token, { date: DAY, slot: 'morning', value: 90 })).data;
    await add(token, { date: DAY, slot: 'after_lunch', value: 140 });

    const same = await api.call('PUT', `/readings/${morning.id}`, { token, body: { date: DAY, slot: 'morning', value: 99 } });
    assert.equal(same.status, 200);
    assert.equal(same.data.value, 99);

    const clash = await api.call('PUT', `/readings/${morning.id}`, { token, body: { date: DAY, slot: 'after_lunch', value: 99 } });
    assert.equal(clash.status, 409);
    assert.equal(clash.data.error, 'You already have an After lunch reading for this date.');

    const invalid = await api.call('PUT', `/readings/${morning.id}`, { token, body: { date: DAY, slot: 'morning', value: 5 } });
    assert.equal(invalid.status, 400);
  });

  test('deleting removes the reading, and deleting twice gives 404', async () => {
    const { token } = await api.registerUser();
    const { id } = (await add(token, { date: DAY, slot: 'morning', value: 90 })).data;
    assert.equal((await api.call('DELETE', `/readings/${id}`, { token })).status, 204);
    const again = await api.call('DELETE', `/readings/${id}`, { token });
    assert.equal(again.status, 404);
    assert.equal(again.data.error, 'Reading not found.');
    assert.equal((await api.call('GET', `/readings?date=${DAY}`, { token })).data.total, 0);
  });

  test('ids that are not valid numbers answer 404, not 500', async () => {
    const { token } = await api.registerUser();
    const body = { date: DAY, slot: 'morning', value: 90 };
    for (const id of ['abc', '1.5', '-1', '99999999999']) {
      assert.equal((await api.call('PUT', `/readings/${id}`, { token, body })).status, 404, `PUT ${id}`);
      assert.equal((await api.call('DELETE', `/readings/${id}`, { token })).status, 404, `DELETE ${id}`);
    }
  });

  test('a user only sees and changes their own readings', async () => {
    const alice = await api.registerUser('Alice');
    const bob = await api.registerUser('Bob');
    const { id } = (await add(alice.token, { date: DAY, slot: 'morning', value: 90 })).data;

    const bobList = await api.call('GET', '/readings', { token: bob.token });
    assert.equal(bobList.data.total, 0);

    const edit = await api.call('PUT', `/readings/${id}`, { token: bob.token, body: { date: DAY, slot: 'morning', value: 500 } });
    assert.equal(edit.status, 404);
    assert.equal((await api.call('DELETE', `/readings/${id}`, { token: bob.token })).status, 404);

    const aliceList = await api.call('GET', '/readings', { token: alice.token });
    assert.equal(aliceList.data.readings[0].value, 90); // untouched
  });

  test('pagination: page and limit split the list and total stays the same', async () => {
    const { token } = await api.registerUser();
    for (const date of ['2026-01-01', '2026-01-02', '2026-01-03']) {
      await add(token, { date, slot: 'morning', value: 100 });
    }
    const first = await api.call('GET', '/readings?page=1&limit=2', { token });
    assert.equal(first.data.total, 3);
    assert.equal(first.data.readings.length, 2);
    assert.equal(first.data.readings[0].date, '2026-01-03'); // newest first

    const second = await api.call('GET', '/readings?page=2&limit=2', { token });
    assert.equal(second.data.readings.length, 1);
    assert.equal(second.data.readings[0].date, '2026-01-01');
  });

  test('an invalid date filter is a 400', async () => {
    const { token } = await api.registerUser();
    const res = await api.call('GET', '/readings?date=2026-13-45', { token });
    assert.equal(res.status, 400);
    assert.equal(res.data.error, 'Please choose a valid date.');
  });
});
