'use strict';
let mongoose = require('mongoose');

let PostSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now 
  },
  comments: [String]
});

let Post = mongoose.model('Post', PostSchema);
module.exports.Post = Post;