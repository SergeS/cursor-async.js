/* global describe, it, beforeEach, expect, jasmine, require, __dirname, Promise, setTimeout */

const CursorAsync = require( `${__dirname}/../cursor-async` );

describe( 'CursorAsync', () => {
  var cursor;

  it( 'Should be defined', () => {
    expect( CursorAsync ).toBeDefined();
  } );

  it( 'Should be a function', () => {
    expect( typeof CursorAsync ).toBe( 'function' );
  } );

  it( 'Should have all public functions registered', () => {
    var
      functions = [],
      i;
    for ( i in CursorAsync.prototype ) {
      functions.push( i );
    }

    expect( functions ).toEqual( functions );
  } );

  beforeEach( () => {
    cursor = new CursorAsync();
  } );

  it( 'Should return only needed functions to public', () => {
    var
      functions = [],
      i,
      publicInt = cursor.getPublicInterface();

    for ( i in publicInt ) {
      functions.push( i );
    }

    expect( functions ).toEqual( functions );
  } );

  it( 'Should collect all recieved rows, if no function defined', ( done ) => {
    cursor.then( ( result ) => {
      expect( result ).toEqual( [ 1, 2 ] );

      done();
    } );

    cursor.push( 1 );
    cursor.push( 2 );

    cursor.end();
  } );

  describe( 'each()', () => {
    var
      eachSpy,
      eachPromise;

    beforeEach( () => {
      eachSpy = jasmine.createSpy( 'eachSpy' );
      eachPromise = cursor.each( eachSpy );
    } );

    it( 'Should not get any results in output', ( done ) => {
      eachPromise.then( ( result ) => {
        expect( result ).toEqual( [] );
        done();
      } );

      cursor.push( 1 );
      cursor.push( 2 );

      cursor.end();
    } );

    it( 'Should call .each callee for each row', ( done ) => {
      eachPromise.then( () => {
        expect( eachSpy.calls.count() ).toEqual( 2 );
        done();
      } );

      cursor.push( 1 );
      cursor.push( 2 );

      cursor.end();
    } );

    it( 'Should keep same this context', ( done ) => {
      cursor.each( () => {
        this.foo = 3;
      } ).then( () => {
        expect( this.foo ).toEqual( 3 );
        done();
      } );

      cursor.push( 1 );
      cursor.push( 2 );

      cursor.end();
    } );
  } );

  describe( 'map()', () => {
    it( 'Should propertly calculate output', ( done ) => {
      cursor.map( ( row ) => {
        return row + 1;
      } ).then( ( result ) => {
        expect( result ).toEqual( [ 2, 3 ] );
        done();
      } );

      cursor.push( 1 );
      cursor.push( 2 );

      cursor.end();
    } );

    it( 'Should keep order of variables', ( done ) => {
      cursor.map( ( row ) => {
        return new Promise( ( resolve ) => {
          if ( row === 2 ) {
            return resolve( 2 );
          }

          setTimeout( () => {
            resolve( row );
          }, 100 );
        } );
      } ).then( ( result ) => {
        expect( result ).toEqual( [ 1, 2 ] );
        done();
      } );

      cursor.push( 1 );
      cursor.push( 2 );

      cursor.end();
    } );
  } );

  describe( 'reduce()', () => {
    it( 'Should not put anything out unless needed', ( done ) => {
      cursor.reduce( ( push, row ) => {
        if ( row === 2 ) {
          push( row );
        }
      } ).then( ( result ) => {
        expect( result ).toEqual( [ 2 ] );
        done();
      } );

      cursor.push( 1 );
      cursor.push( 2 );
      cursor.push( 3 );

      cursor.end();
    } );
  } );
} );

