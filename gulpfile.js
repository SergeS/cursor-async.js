/* global require, __dirname */

const
  gulp = require( 'gulp' ),
  jasmine = require( 'gulp-jasmine' ),
  eslint = require( 'gulp-eslint' ),
  reporters = require( 'jasmine-reporters' );

gulp.task( 'default', [ 'check' ] );
gulp.task( 'check', [ 'eslint', 'test' ] );

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
        savePath: `${__dirname}/test-reports`
      } )
    } ) )
} );
