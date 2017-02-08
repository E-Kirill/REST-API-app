'use strict';
let mongoose = require('mongoose');

let PostSchema = new mongoose.Schema({
  author: { // post author
    type: String,
    required: true
  },
  topic: { // post title
    type: String,
    required: true
  },
  text: { // post content
    type: String,
    required: true
  },
  date: { // date of creation
    type: Date,
    default: Date.now 
  },
  comments: [String] // own comments
});

let Post = mongoose.model('Post', PostSchema);
module.exports.Post = Post;