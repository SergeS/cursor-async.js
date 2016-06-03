/* global require, __dirname */

const
  gulp = require( 'gulp' ),
  jasmine = require( 'gulp-jasmine' ),
  uglify = require( 'gulp-uglify' ),
  rename = require( 'gulp-rename' ),
  eslint = require( 'gulp-eslint' ),
  reporters = require( 'jasmine-reporters' );

gulp.task( 'default', [ 'check', 'build' ] );
gulp.task( 'check', [ 'eslint', 'test' ] );

gulp.task( 'build', () => {
  return gulp.src( `${__dirname}/cursor-async.js` )
    .pipe( uglify() )
    .pipe( rename( 'cursor-async.min.js' ) )
    .pipe( gulp.dest( __dirname ) )
    ;
} );

gulp.task( 'eslint', () => {
  return gulp.src( [ `${__dirname}/**/*.js`, `!${__dirname}/node_modules/**/*.js` ], { base: __dirname } )
    .pipe( eslint( { fix: true } ) )
    .pipe( eslint.format() )
    .pipe( gulp.dest( __dirname ) )
    .pipe( eslint.failAfterError() )
    ;
} );

gulp.task( 'test', () => {
  return gulp.src( [ `${__dirname}/spec/**/*.js` ] )
    .pipe( jasmine( {
      reporter: new reporters.JUnitXmlReporter( {
        savePath: `${__dirname}/test-results`
      } )
    } ) )
} );
