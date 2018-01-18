json-split-stream
=================

[![NPM Version](https://img.shields.io/npm/v/json-split-stream.svg?style=flat)](https://npmjs.org/package/json-split-stream)
[![NPM Downloads](https://img.shields.io/npm/dm/json-split-stream.svg?style=flat)](https://npmjs.org/package/json-split-stream)
[![Build Status](https://travis-ci.org/addaleax/json-split-stream.svg?style=flat&branch=master)](https://travis-ci.org/addaleax/json-split-stream?branch=master)
[![Coverage Status](https://coveralls.io/repos/addaleax/json-split-stream/badge.svg?branch=master)](https://coveralls.io/r/addaleax/json-split-stream?branch=master)
[![Dependency Status](https://david-dm.org/addaleax/json-split-stream.svg?style=flat)](https://david-dm.org/addaleax/json-split-stream)

A fast way to split concatenated JSON data into individual chunks.

Install:
`npm install json-split-stream`

```js
const JSONSplitStream = require('json-split-stream');

const chunker = new JSONSplitStream();  // is a Duplex stream

chunker.write('[1,2,3]{"a":12}');
chunker.read(); // => '[1,2,3]'
chunker.read(); // => '{"a":12}'
chunker.read(); // => null
```

License
=======

MIT
