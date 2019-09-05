var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
//var logger = require('morgan');
var logger = require('logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var admin = require('./routes/admin');
var auth = require('./routes/auth');
var profile = require('./routes/profile');
var committees = require('./routes/committees');
var thesis = require('./routes/thesis');
var communication = require('./routes/communication');
var status = require('./routes/status');

var compression = require('compression');

/* BEGIN: Add session and user required modules */
var session = require('express-session');
var Store = require('express-sequelize-session') (session.Store);
var bcrypt = require('bcrypt');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var LTIStrategy = require('passport-lti');
var Model = require('./models');

var ltiMiddleware = require("express-ims-lti");
/* END */



let mailer = require('./lib/mail');

mailer.verify(function(error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Mail system is working");
    const test_message = {
        from: 'xbaro@uoc.edu',
        to: 'xavierbaro@gmail.com',
        subject: 'Test MCV mail system',
        html: '<h1>Test Message!</h1><p>This is a test message from MCV Theses manager system.</p>'
    };
    /*mailer.sendMail(test_message, function (err, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("Test mail sent");
        }
    });*/
  }
});



var app = express();

app.set('forceSSLOptions', {
    enable301Redirects: false
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// compress all requests
app.use(compression());

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public'), {force: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

app.locals.sprintf = require('sprintf').sprintf;
app.locals.format = "%+1.0f";

/* BEGIN: Configure Passport for user authentication */
passport.use(new LocalStrategy(function (username, password, done) {
    Model.User.findOne({
        where: {username: username}})
        .then(function(data) {
            var user = data;
            if (user === null) {
                return done(null, false, { message: 'Invalid username or password' });
            } else {
                user = data.toJSON();
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, { message: 'Invalid username or password' });
                } else {
                    return done(null, user);
                }
            }
    })
}));

passport.use(new LTIStrategy({
        consumerKey: 'mcv_thesis_key',
        consumerSecret: 'secret'
    }, function(lti, done) {
        // Create a username for this lti user
        username = '';
        if (lti.ext_user_username ) {
            username = lti.ext_user_username;
        }
        if (username.length == 0) {
            username = lti.lis_person_contact_email_primary.split('@')[0] ;
        }
        username = 'lti-' + lti.user_id + '-' + username;

        Model.User.findOne({
        where: {username: username}})
        .then(function(data) {
            var user = data;
            if (user === null) {
                // Create the user object
                new_user = {};
                new_user.password = 'XXXXDDDDXXXX';
                new_user.name = lti.lis_person_name_given;
                new_user.surname = lti.lis_person_name_family;
                new_user.email = lti.lis_person_contact_email_primary;
                new_user.teacher = false;
                for(var i =0; i<lti.roles.length; i++) {
                    if (lti.roles[i] =="Instructor") {
                        new_user.teacher = true;
                    }
                }

                Model.User
                .findOrCreate({where: {username: username, password: new_user.password, name: new_user.name, surname: new_user.surname, email: new_user.email, teacher: new_user.teacher}})
                .spread(function(user, created) {
                    return done(null, user);
                })

            } else {
                return done(null, user);
            }
        })
}));

passport.serializeUser(function (user, done) {
    done(null, user.username);
});

passport.deserializeUser(function (username, done) {

    Model.User.findOne({
        where: {username: username}})
        .then(function(user) {
            done(null, user);
        });
});

var sessionStore = new Store(Model.sequelize)
app.use(session({
    secret: 'secret',
    name: 'mcv_thesis',
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
 /* END */

app.use('/', routes);
app.use('/admin', admin);
app.use('/auth', auth);
app.use('/profile', profile);
app.use('/thesis', thesis);
app.use('/committees', committees);
app.use('/communication', communication);
app.use('/status', status);




app.use(ltiMiddleware({
  // You must use either the credentials option or the consumer_key and
  // consumer_secret. The credentials option a function that accepts a key and
  // a callback to perform an asynchronous operation to fetch the secret.
  credentials: function (key, callback) {
    // `this` is a reference to the request object.
    var consumer = this.consumer = fetchLtiConsumer(key);
    // The first parameter is an error (null if there is none).
    callback(null, key, consumer.secret);
  },

  consumer_key: "mcv_thesis_key",       // Required if not using credentials.
  consumer_secret: "secret", // Required if not using credentials.

}));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
