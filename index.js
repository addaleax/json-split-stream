'use strict';
const assert = require('assert');
const stream = require('readable-stream');
const Duplex = stream.Duplex;

class JSONSplitter extends Duplex {
  constructor(options) {
    super(Object.assign({}, options, {
      readableObjectMode: true,
      decodeStrings: false,
      encoding: 'utf8'
    }));

    this.expectedTerminatorStack = [''];
    this.buffer = '';
    this.charactersRead = 0;
    this.position = 0;
    this.skipped = 0;
    this.storeData = options && options.storeData === false ? false : true;

    const passThrough = new stream.PassThrough({
      encoding: 'utf8',
      decodeStrings: false
    });

    this.decode = function(chunk, encoding) {
      if (typeof chunk === 'string')
        return chunk;
      passThrough.write(chunk, encoding);
      return passThrough.read();
    };

    this.on('prefinish', function() { this.flush(); });
  }

  _trimStart() {
    const len = this.buffer.length;
    this.buffer = this.buffer.trimStart();
    this.skipped += len - this.buffer.length;
  }

  _write(chunk, encoding, callback) {
    this.buffer += this.decode(chunk, encoding);
    this._trimStart()

    this._search();
    if (!this.storeData) {
      this.charactersRead += this.buffer.length;
      this.buffer = '';
      this.position = 0;
    }
    callback();
  }

  _search() {
    do {
      const stack = this.expectedTerminatorStack;
      const lookfor = stack[stack.length - 1];

      var first = -1;
      var openArray = -1;
      var openString = -1;
      var openObject = -1;
      var close = -1;

      if (lookfor !== '}' && lookfor !== '"') {
        openArray = first = this.buffer.indexOf('[', this.position);
      }

      if (lookfor !== ']' && lookfor !== '"') {
        openObject = this.buffer.indexOf('{', this.position);
        if (first === -1 || (openObject !== -1 && openObject < first))
          first = openObject;
      }

      {
        openString = this.buffer.indexOf('"', this.position);
        if (first === -1 || (openString !== -1 && openString < first))
          first = openString;
      }

      if (lookfor !== '') {
        close = this.buffer.indexOf(lookfor, this.position);
        if (first === -1 || (close !== -1 && close < first))
          first = close;
      }

      if (first === -1) {
        this.position = this.buffer.length;
        break;
      }

      this.position = first + 1;
      if (first === close) {
        if (lookfor === '"' && this.buffer[close - 1] === '\\') {
          var backslashes = 1;
          for (var i = close - 2; ; --i) {
            if (this.buffer[i] === '\\')
              backslashes++;
            else
              break;
          }

          if (backslashes % 2 === 1)
            continue;
        }

        stack.pop();
        if (stack.length === 1) {
          this.charactersRead += this.position + this.skipped;
          this.skipped = 0;

          this.emit('finishedJSON', { jsonEnd: this.charactersRead });
          if (this.storeData) {
            this.push(this.buffer.substring(0, this.position));
          }
          this.buffer = this.buffer.substring(this.position);
          this._trimStart();

          this.position = 0;
        }
      } else if (first === openString) {
        stack.push('"');
      } else if (first === openObject) {
        stack.push('}');
      } else {
        assert(first === openArray);
        stack.push(']');
      }
    } while(true);
  }

  flush() {
    if (this.buffer.length > 0 && this.storeData)
      this.push(this.buffer);
    this.push(null);
  }

  _read() {
  }
}

module.exports = JSONSplitter;
