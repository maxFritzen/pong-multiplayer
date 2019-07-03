var expect = require('expect');

var { generateMessage, generateLocationMessage } = require('./message');

describe('generateMessage', () => {
  it('Should generate correct message object', () => {
    var from = 'My';
    var text = 'Some message';
    var message = generateMessage(from, text);
    
    expect(message.createdAt).toBeA('number');
    expect(message).toInclude({ from, text });
  });
});

describe('generateLocationMessage', () => {
  it('Should generate correct message object', () => {
    var from = 'My';
    var latitude = 2;
    var longitude = 1;
    var message = generateLocationMessage(from, latitude, longitude);
    var url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    
    
    expect(message.createdAt).toBeA('number');
    expect(message).toInclude({ from, url });
  });
});

