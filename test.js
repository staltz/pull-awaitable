var pull = require('../pull-stream');
var test = require('tape');
var awaitable = require('./index');

function delay() {
  return pull.asyncMap(function(x, cb) {
    setTimeout(function() {
      cb(null, x);
    }, 100);
  });
}

test('consume 4 sync values with for-await-of', async function(t) {
  var expected = [10, 20, 30, 40];
  var readable = pull(pull.values([1, 2, 3, 4]), pull.map(x => x * 10));
  for await (var x of awaitable(readable)) {
    const e = expected.shift();
    t.equals(x, e, 'should be ' + e);
  }
  t.end();
});

test('consume 4 async values with for-await-of', async function(t) {
  var expected = [10, 20, 30, 40];
  var readable = pull(
    pull.values([1, 2, 3, 4]),
    delay(),
    pull.map(x => x * 10),
  );
  for await (var x of awaitable(readable)) {
    const e = expected.shift();
    t.equals(x, e, 'should be ' + e);
  }
  t.end();
});

test('propagates error with for-await-of', async function(t) {
  var expected = [10, 20];
  var readable = pull(
    pull.values([1, 2, 3, 4]),
    pull.asyncMap((x, cb) => {
      if (x === 3) cb(new Error('bad stuff'));
      else cb(null, x);
    }),
    pull.map(x => x * 10),
  );
  try {
    for await (var x of awaitable(readable)) {
      const e = expected.shift();
      t.equals(x, e, 'should be ' + e);
    }
  } catch (err) {
    t.equals(err.message, 'bad stuff', 'error says "bad stuff"');
    t.equals(expected.length, 0, 'no more values expected to come');
    t.end();
  }
});
