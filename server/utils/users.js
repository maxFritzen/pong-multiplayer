
class Users {
  constructor () {
    this.users = [];
  }

  addUser (id, name, room) {
    var user = {id, name, room};
    this.users.push(user);
    return user;
  }

  getUser (id) {
    var user = this.users.filter((user) => user.id === id)[0];
    return user;
  }

  removeUser (id) {
    var user = this.getUser(id);

    if (user){
      var remainingUsers = this.users.filter((user) => user.id !== id);
      this.users = remainingUsers;
    }

    return user;
    
  }

  getListOfUsers (room) {
    var filteredUsers = this.users.filter((user) => user.room === room);
    var userNames = filteredUsers.map((user) => user.name);
    return userNames;
  }
}

module.exports = { Users };