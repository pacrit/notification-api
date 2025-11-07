const User = require('../models/User');

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  async findByEmail(email) {
    return User.findOne({ email }).select('+password');
  }

  async findById(id) {
    return User.findById(id);
  }

  async existsByEmail(email) {
    return User.exists({ email });
  }
}

module.exports = new UserRepository();