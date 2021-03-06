var gulp = require('gulp'), 
    sass = require('gulp-sass'),
    notify = require("gulp-notify") 
    bower = require('gulp-bower');

var minify = require('gulp-minify');

var config = {
     sassPath: './resources/sass',
     bowerDir: './bower_components' 
};

gulp.task('bower', function() { 
    return bower()
         .pipe(gulp.dest('./public/lib')) 
});

gulp.task('icons', function() { 
    return gulp.src(config.bowerDir + '/font-awesome/fonts/**.*') 
        .pipe(gulp.dest('./public/lib/fonts')); 
});

gulp.task('css', function() { 
    return gulp.src(config.bowerDir + '/**/*.scss')
         .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
         .pipe(gulp.dest('./public/lib/css/')); 
});

// Rerun the task when a file changes
 gulp.task('watch', function() {
     gulp.watch(config.bowerDir + '/**/*.scss', ['css']); 
});

gulp.task('compress', function() {
  return gulp.src('public/js/**/*.js')
    .pipe(minify({
        ext:{
            src:'-debug.js',
            min:'.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['.combo.js', '-min.js']
    }))
    .pipe(gulp.dest('public/dist'))
});

  gulp.task('default', gulp.series('bower', 'icons', 'css', 'compress'));