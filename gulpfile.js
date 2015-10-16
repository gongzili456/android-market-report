var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var pngquant = require('imagemin-pngquant');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var argv = require('minimist')(process.argv.slice(2));

var DEBUG = !!argv.debug;

var BOWER_COMPONENTS = './bower_components/';
var BUILD = './public/build/';
var PUBLIC = './public/';

var src = {};

// https://github.com/ai/autoprefixer
var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// Launch BrowserSync development server
gulp.task('sync', function() {
  browserSync({
    files: [
      './app/views/**/*.html',
      './public/views/**/*.html'
    ],
    logPrefix: 'dmc-admin',
    proxy: 'http://lo.topdmc.cn:9000',
    host: 'lo.topdmc.cn',
    open: 'external'
  });
  gulp.watch(PUBLIC + 'less/*.less', ['styles']);
  gulp.watch(PUBLIC + 'js/*.js', ['js']);
});

gulp.task('bower_libs', function() {
  gulp.src([
    BOWER_COMPONENTS + 'angular/angular.min.js',
    BOWER_COMPONENTS + 'angular/angular.min.js.map',
    BOWER_COMPONENTS + 'angular-ui-router/release/angular-ui-router.min.js',
    BOWER_COMPONENTS + 'jQuery/dist/jquery.min.js',
    BOWER_COMPONENTS + 'remarkable-bootstrap-notify/dist/bootstrap-notify.min.js',
    BOWER_COMPONENTS + 'jQuery/dist/jquery.min.map',
    BOWER_COMPONENTS + 'tablesorter/dist/js/jquery.tablesorter.min.js',
    BOWER_COMPONENTS + 'echarts/build/dist/echarts-all.js',
    BOWER_COMPONENTS + 'echarts/build/dist/chart/*'
  ]).pipe(gulp.dest(BUILD + 'js'));
  gulp.src(BOWER_COMPONENTS + 'fontawesome/css/font-awesome.min.css')
    .pipe(gulp.dest(BUILD + 'css'));
  return gulp.src(BOWER_COMPONENTS + 'fontawesome/fonts/*')
    .pipe(gulp.dest(BUILD + 'fonts'));
});

gulp.task('images', function() {
  return gulp.src(PUBLIC + 'images/*')
    .pipe(gulp.dest(BUILD + 'images'));
});

gulp.task('images:minify', function () {
  return gulp.src(PUBLIC + 'images/*')
    .pipe($.imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(BUILD + 'images'));
});

gulp.task('styles', function() {
  return gulp.src([
    PUBLIC + 'less/main.less',
    PUBLIC + 'less/application.less',
    PUBLIC + 'less/toolkit-inverse.less'
  ])
    .pipe($.less())
    .pipe($.autoprefixer({
      browsers: AUTOPREFIXER_BROWSERS
    }))
    .pipe(gulp.dest(BUILD + 'css'))
    .pipe(reload({stream: true}));
});

gulp.task('styles:minify', function() {
  return gulp.src([
    BUILD + 'css/main.css',
    BUILD + 'css/application.css',
    BUILD + 'css/toolkit-inverse.css'
  ])
    .pipe($.minifyCss())
    .pipe(gulp.dest(BUILD + 'css'));
});

gulp.task('js', function() {
  return gulp.src([
    PUBLIC + 'js/toolkit.js',
    PUBLIC + 'js/*.js',
    PUBLIC + 'js/*.js'
  ])
    .pipe($.concat('common.js'))
    .pipe(gulp.dest(BUILD + 'js'))
    .pipe(reload({stream: true}));
});

gulp.task('js:minify', function() {
  return gulp.src(BUILD + 'js/common.js')
    .pipe($.uglify())
    .pipe(gulp.dest(BUILD + 'js'));
});

gulp.task('mbs', function() {
  return gulp.src(PUBLIC + 'less/mbs/mbs.less')
    .pipe($.less())
    .pipe($.minifyCss({keepBreaks: false}))
    .pipe(gulp.dest(BUILD + 'css'));
});

gulp.task('mbs:minify', function() {
  return gulp.src(BUILD + 'css/mbs.css')
    .pipe($.minifyCss())
    .pipe(gulp.dest(BUILD + 'css'));
});

var started = false;
// Launch a Node.js/Express server
gulp.task('server', ['build'], function(cb) {
  src.server = [
    './server.js',
    './app/**/*.js'
  ];

  var started = false;
  var cp = require('child_process');

  var server = (function startup() {
    var child = cp.fork('./server.js', {
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });
    child.once('message', function(message) {
      if (message.match(/^online$/)) {
        if (browserSync) {
          reload();
        }
        if (!started) {
          started = true;
          gulp.watch(src.server, function() {
            $.util.log('Restarting development server.');
            server.kill('SIGTERM');
            server = startup();
          });
          cb();
        }
      }
    });
    return child;
  })();

  process.on('exit', function() {
    server.kill('SIGTERM');
  });
});

// Build the app
gulp.task('build', function() {
  if (DEBUG) {
    runSequence(['bower_libs', 'images', 'styles', 'mbs', 'js'], 'sync');
  } else {
    runSequence(['bower_libs', 'styles', 'mbs', 'js'], ['styles:minify', 'mbs:minify', 'images:minify', 'js:minify']);
  }
});

gulp.task('default', ['build']);
