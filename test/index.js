'use strict';

const JSONSplitter = require('../');
const assert = require('assert');

describe('JSONSplitter', function() {
  describe('chunks JSON data', function() {
    const cases = [
      [ [1,2,3], [4,5,6] ],
      [ [{"a":1},2,3], [4,5,6] ],
      [ [{"a\\":1},2,3], [4,5,6] ],
      [ [{"a\\\\":1},2,3], [4,5,6] ],
      [ [{"a\\\\":1},2,3], [4,5,6], [7,8,9] ],
      [ [{"a\\\"":1},2,3], [4,5,6], [7,8,9] ],
      [ {"a\\\"":1}, [4,5,6], [7,8,9] ],
      [ {"ö\\\"":1}, [4,5,6], [7,8,9] ],
      [ {"🎉\\\"":1}, [4,5,6], [7,8,9], "foo" ],
      [ [1,2,3], {"a":12} ]
    ];

    for (let i = 0; i < cases.length; ++i) {
      const str = cases[i].map(obj => JSON.stringify(obj)).join('');
      for (let type of ['string', 'buffer']) {
        it(`handles ${str} as a ${type}`, function() {
          const s = new JSONSplitter();
          s.end(type === 'buffer' ? Buffer.from(str) : str);

          var output, j = 0;
          while (output = s.read()) {
            assert.deepStrictEqual(JSON.parse(output), cases[i][j++]);
          }
          assert.strictEqual(j, cases[i].length);
        });
      }
    }
  });

  it('yields data on final', function() {
    const s = new JSONSplitter();
    s.write('[] {}""foo');
    assert.strictEqual(s.read(), '[]');
    assert.strictEqual(s.read(), '{}');
    assert.strictEqual(s.read(), '""');
    assert.strictEqual(s.read(), null);
    s.end();
    assert.strictEqual(s.read(), 'foo');
  });

  it('emits json chunk offsets', function() {
    const s = new JSONSplitter();
    let called = [];
    s.on('finishedJSON', position => called.push(position.jsonEnd));
    s.write('[');
    assert.deepStrictEqual(called, []);
    s.write(']');
    assert.deepStrictEqual(called, [2]);
    s.write(' {}{}');
    assert.deepStrictEqual(called, [2, 5, 7]);
    assert.deepStrictEqual(s.read(), '[]');
    assert.deepStrictEqual(s.read(), '{}');
    assert.deepStrictEqual(s.read(), '{}');
    assert.deepStrictEqual(s.read(), null);
  });

  it('emits json chunk offsets in non-storing mode', function() {
    const s = new JSONSplitter({ storeData: false });
    let called = [];
    s.on('finishedJSON', position => called.push(position.jsonEnd));
    s.write('[');
    assert.deepStrictEqual(called, []);
    s.write(']');
    assert.deepStrictEqual(called, [2]);
    s.write(' {}{}');
    assert.deepStrictEqual(called, [2, 5, 7]);
    assert.deepStrictEqual(s.read(), null);
  });
});
