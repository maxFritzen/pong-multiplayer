const expect = require('expect');
const { Users } = require('./users');

describe ('Users', () => {

  const users = new Users();
  beforeEach(() => {
    users.users = [{
      id: '1',
      name: 'Max',
      room: 'One'
    }, {
      id: '2',
      name: 'My',
      room: 'One'
    }, {
      id: '3',
      name: 'Jonas',
      room: 'Two'
    }]
  })

  it ('should add user', () => {
    const users = new Users();
    const user = {
      id: '123',
      name: 'Max',
      room: 'Home'
    };
    users.addUser(user.id, user.name, user.room);
    
    expect(users.users).toEqual([user]);
  });

  it ('should remove a user', () => {
    var userToRemove = {
      id: '3',
      name: 'Jonas',
      room: 'Two'
    };
    users.removeUser('3');
    expect(users.users).toNotContain(userToRemove);
  });

  it ('should not remove a user', () => {
    users.removeUser('NotAUser');
    expect(users.users.length).toBe(3);
  });

  it ('should find user', () => {
    var user = users.getUser('1');
    console.log(users.getUser('1'));
    expect(user.name).toBe('Max');
  });

  it ('should not find user', () => {
    var user = users.getUser('nope');
    expect(user).toNotExist();
  });

  it ('should return users in room One', () => {
    const userList = users.getListOfUsers('One');
    expect(userList).toEqual(['Max', 'My']);
  });
});