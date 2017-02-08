'use strict';
let mongoose = require('mongoose');

let CommentSchema = new mongoose.Schema({
  author: {// author id
    type: String,
    required: true
  },
  text: { // content of comment
    type: String,
    required: true
  },
  articleId:{ // parent
    type: String,
    required:true
  },
  date: { // date of creation
    type: Date,
    default: Date.now 
  },
  answers: [{ // nested comments
      id: String,
      default: ""
  }]
});

let Comment = mongoose.model('Comment', CommentSchema);
module.exports.Comment = Comment;