var expect = require('expect');

var { isRealString } = require('./validation');

describe('isRealString', () => {
  it('should reject non-string values', () => {
    var arg = isRealString({})
    expect(arg).toBe(false);
  });

  it('should reject string with only spaces', () => {
    var arg = isRealString('    ')
    expect(arg).toBe(false);
  });

  it('should allow string with non-space characters', () => {
    var arg = isRealString('allowed')
    expect(arg).toBe(true);
  });
});