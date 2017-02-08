'use strict';
let mongoose = require('mongoose');

let UserSchema = new mongoose.Schema({
  username: { //user email
    type: String,
    unique: true,
    required: true
  },
  password: { // user password
    type: String,
    required: true
  },
  name: { //name of user
    type: String
  },
  surname:{ //surname of user
    type: String
  },
  userpic: { // avatar profile
      type:String,
      default: ""
  },
  date: { // date of profile creation
    type: Date,
    default: Date.now 
  },
  posts: [String], // own posts
  comments:[String] // own comments
});

let User = mongoose.model('User', UserSchema);
module.exports.User = User;