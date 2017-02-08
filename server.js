'use strict';
let express = require('express'),
    app = express(),

    PORT = require('./config/mainconfig').PORT,
    dbConnectUrl = require('./config/mainconfig').dbConnectUrl;
 
// dependencies
let passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    bodyParser = require('body-parser');
    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({extended: true}));
    // parse application/json
    app.use(bodyParser.json());
let redis = require("redis"),
    RedisStore = require('connect-redis')(session);
    app.use(cookieParser());
    app.use(session({
        secret: 'SECRET',
        store:new RedisStore
    }));
    // passport init
    app.use(passport.initialize());
    app.use(passport.session());

// middleware
require('./middleware/passport-init')();
let login = require('./middleware/auth-controllers').login,
    reg = require('./middleware/auth-controllers').reg,
    logout = require('./middleware/auth-controllers').logout,
    isAuth = require('./middleware/auth-checking').isAuth,
    logs = require('./middleware/logs').reqInfo;

// connecting mongoDB
let mongoose = require('mongoose');
    mongoose.connect('mongodb://' + dbConnectUrl);
let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        mongoose.Promise = global.Promise;
        console.log(' db connected\n');
    });

// models
let User = require('./models/user-Schema').User,
    Post = require('./models/post-Schema').Post,
    Comment = require('./models/comment-Schema').Comment;

// routes
app.post('/', login);
app.post('/register', reg);
app.get('/logout', logout);

app.all('/api/*', isAuth);
app.all('/api', isAuth);

app.use((req, res, next) => {
    logs(req);
    next();
});

app.get('/api/blog/count', (req, res)=>{
    User.findById(JSON.parse(req.query.where).author, (err, user)=>{
        if (err) return err;
        if(user) {
            let obj = {count: user.posts.length};
            res.json(obj);
        }else{
            res.sendStatus(404);
        }
    });
});

app.get('/api/blog', (req, res) => {
    User.findById(JSON.parse(req.query.where).author, (err, user)=>{
        if (err) return err;
        if(user) {
            let limit = 10;
            if(req.body.limit) {
                limit = req.body.limit;
            }
            let offset = 0;
            if(req.body.offset) {
                offset = req.body.offset;
            }
            let order;
            if(req.query.order) {
                order= JSON.parse(req.query.order).order;
            }
            let posts = [];
            switch(order || 'from new to old') {
                case 'from new to old':
                    for (offset; offset >= user.posts.length; offset++) {
                        if(user.posts[offset] && posts.length <= limit) {
                            Post.findById(user.posts[offset]), (err, post)=>{
                                posts.push(post);
                            };
                        }else{
                            break;
                        }
                    }
                break;
            }
            res.json(posts);
        }else{
            res.sendStatus(404);
        }
    });
});

app.post('/api/blog', (req, res) => {
    User.findById(req.user._id, (err, user)=>{
        if (err) return error;
        if(user && req.user._id == user._id) {
            let post = new Post({author: user._id,
                topic: req.body.title,
                text: req.body.body,
            });
            post.save((err, post)=> {
                if (err) return err;
                user.posts.push( post._id );
                user.save((err)=>err);
                res.json(post);
            });
        }else{
            res.sendStatus(404);
        }
    });
});

app.get('api/blog/:id', (req, res)=>{
    Post.findById(req.params.id, (err, post)=>{
        if (err) return err;
        if(post) {
            res.json(post);
        }else{
            res.sendStatus(404);
        }
    });
});

app.put('api/blog/:id', (req, res)=>{
    Post.findById(req.params.id, (err, post)=>{
        if (err) return err;
        if(post && req.user._id == post.author) {
            post.text = req.body.body;
            post.save((err)=>err);
            res.json(post);
        }else{
            res.sendStatus(404);
        }
    });
});

app.delete('/api/blog/:id', (req, res) => {
    User.findById(req.user._id, (err, user)=>{
        if (err) return error;
        if(user && req.user._id == user._id) {
            let index;
            user.posts.forEach((item, i)=>{
                if(item == req.params.id) {
                    index = i;
                }
            });
            if(index) {
                user.posts.splice(index, 1);
            }
            user.save((err)=>err);
            Post.findByIdAndRemove(req.params.id, (err, post)=>{
                if(err) return err;
                if(post) {
                    res.json(post);
                }else{
                    res.sendStatus(404);
                }
            });
        }else{
            res.sendStatus(404);
        }
    });
});

app.get('/api/comments/count', (req, res)=>{
    Post.findById(JSON.parse(req.query.where).articleId, (err, post)=>{
        if (err) return err;
        if(post) {
            let obj = {count: post.comments.length};
            res.json(obj);
        }else{
            res.sendStatus(404);
        }
    });
});

app.get('/api/comments', (req, res) => {
    User.findById(JSON.parse(req.query.where).author, (err, user)=>{
        if (err) return err;
        if(user) {
            let limit = 10;
            if(req.body.limit) {
                limit = req.body.limit;
            }
            let offset = 0;
            if(req.body.offset) {
                offset = req.body.offset;
            }
            let order;
            if(req.query.order) {
                order= JSON.parse(req.query.order).order;
            }
            let comments = [];
            switch(order || 'from new to old') {
                case 'from new to old':
                    for (offset; offset >= user.comments.length; offset++) {
                        if(user.comments[offset] && comments.length <= limit) {
                            Comment.findById(user.comments[offset]), (err, comment)=>{
                                comments.push(comment);
                            };
                        }else{
                            break;
                        }
                    }
                break;
            }
            res.json(comments);
        }else{
            res.sendStatus(404);
        }
    });
});

app.post('/api/comments', (req, res)=>{
    User.findById(req.body.author, (err, user)=>{
        if (err) return error;
        if(user && req.user._id == user._id) {
            let comment = new Comment({
                author: req.body.author,
                articleId: req.body.articleId,
                text: req.body.text,
            });
            comment.save((err, comment)=>{
                user.comments.push(comment._id);
                user.save((err)=>err);
                Post.findById((err, post)=>{
                    post.comments.push(comment._id);
                    post.save((err)=>err);
                    res.json(comment);
                });
            });
        }else{
            res.sendStatus(404);
        }
    });
});

app.get('api/comments/:id', (req, res)=>{
    Comment.findById(req.params.id, (err, comment)=>{
        if (err) return err;
        if(comment) {
            res.json(comment);
        }else{
            res.sendStatus(404);
        }
    });
});


app.put('api/comments/:id', (req, res)=>{
    Comment.findById(req.params.id, (err, comment)=>{
        if (err) return err;
        if(comment && req.user._id == comment.author) {
            comment.text = req.body.text;
            comment.save((err)=>err);
            res.json(comment);
        }else{
            res.sendStatus(404);
        }
    });
});

app.delete('/api/comments/:id', (req, res) => {
    User.findById(req.user._id, (err, user)=>{
        if (err) return error;
        if(user && req.user._id == user.id) {
            let index;
            user.comments.forEach((item, i)=>{
                if(item == req.params.id) {
                    index = i;
                }
            });
            if(index) {
                 user.comments.splice(index, 1);
            }
            user.save((err)=>err);
            Comment.findByIdAndRemove(req.params.id, (err, comment)=>{
                if(err) return err;
                if(comment) {
                    res.json(comment);
                }else{
                    res.sendStatus(404);
                }
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(' app listening on ' + PORT);
});

