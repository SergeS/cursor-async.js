/* global console, Promise, require, exports, module */

( function registerModule( root, CursorAsyncFactory ) {
  if ( typeof require === 'function' && typeof exports === 'object' && typeof module === 'object' ) {
    module.exports = CursorAsyncFactory( Promise );
    return;
  }

  if ( typeof root.angular !== 'undefined' ) {
    try {
      root.angular.module( 'cursor-async', [] ).factory( 'CursorAsync', [ '$q', CursorAsyncFactory ] );
      return;
    } catch ( e ) {
      console.error( 'Failed to init cursor-async with angular', e );
    }
  }

  root.CursorAsync = CursorAsyncFactory( Promise );
} )( this, function CursorAsyncFactory( promise ) {
  var publicInterface = [ 'each', 'map', 'reduce', 'then' ];

  if ( !promise ) {
    console.error( 'Failed to init cursor-async - no promise mechanism found' );
    return;
  }

  function CursorAsync( thisArg ) {
    if ( !( this instanceof CursorAsync ) ) {
      return new CursorAsync( thisArg );
    }

    CursorAsyncInit.call( this, thisArg );
  }


  function CursorAsyncInit( thisArg ) {
    var
      deffered = {},
      cursorPromise = new promise( function cursorPromiseExecutor( resolve, reject ) {
        deffered.resolve = resolve;
        deffered.reject = reject;
      } ),
      rows = [],
      errored = false,
      target,
      fCall,
      currentPromise,
      isConcurrent,
      wrappedCursorPromise = {
        then: function wrappedCursorPromiseThen( done, err, progress ) {
          return cursorPromise.then(
            done ? done.bind( thisArg ) : null,
            err ? err.bind( thisArg ) : null,
            progress ? progress.bind( thisArg ) : null
          )
        }
      };

    function processNextRow() {
      if ( errored ) {
        return promise.resolve();
      }

      if ( !fCall ) {
        return promise.resolve();
      }

      if ( !rows.length ) {
        return promise.resolve();
      }

      return fCall( rows.shift() );
    }

    function registerFunction( callee, autoPush ) {
      function canPush() {
        return target && target.push && autoPush;
      }

      fCall = function registeredFunction( row ) {
        if ( errored ) {
          return;
        }

        return new promise( function registeredFunctionPromise( resolve, reject ) {
          var
            returned = callee.call( thisArg, row ),
            rowPromise;

          if ( returned && returned.then ) {

            rowPromise = returned;
            if ( canPush() ) {
              rowPromise = rowPromise.then( function calleePromiseReturn( outRow ) {
                target.push( outRow );
              } );
            }

            if ( isConcurrent ) {
              rowPromise = promise.all( [ rowPromise, processNextRow() ] );
            } else {
              rowPromise = rowPromise.then( processNextRow );
            }
          } else {
            if ( canPush() ) {
              target.push( returned );
            }

            rowPromise = processNextRow();
          }

          rowPromise.then( resolve, reject );
        } ).then( null, function registeredFunctionError( err ) {
          this.error.call( this, err );
        }.bind( this ) );
      };

      if ( !rows ) {
        return;
      }
    }

    function getPublicInterface() {
      return publicInterface.reduce( function interfaceReducer( out, functionName ) {
        out[ functionName ] = this[ functionName ];
        return out;
      }.bind( this ), {} );
    }

    function each( callee, concurrent ) {
      isConcurrent = concurrent;
      target = null;
      registerFunction( callee, false );
      return wrappedCursorPromise;
    }

    function map( callee, concurrent ) {
      isConcurrent = concurrent;
      target = new CursorAsync( thisArg );
      registerFunction( callee, true );
      return target.getPublicInterface();
    }

    function reduce( callee, concurrent ) {
      isConcurrent = concurrent;
      target = new CursorAsync( thisArg );

      registerFunction( function reduceCallee( row ) {
        return callee( target.push, row );
      }, false );

      return target.getPublicInterface();
    }
    
    function push( item ) {
      var locPromise;

      rows.push( item );
      if ( currentPromise ) {
        if ( isConcurrent ) {
          locPromise = promise.all( [ currentPromise, processNextRow() ] );
        } else {
          locPromise = currentPromise.then( processNextRow )
        }
      } else {
        locPromise = processNextRow();
      }

      locPromise.then( function removeCurrentPromise() {
        if ( locPromise === currentPromise ) {
          currentPromise = undefined;
        }
      } );

      currentPromise = locPromise;
      return currentPromise;
    }

    function error( err ) {
      if ( errored ) {
        return;
      }

      if ( target && target.error ) {
        target.error( err );
      } else {
        deffered.reject( err );
      }

      errored = true;
    }

    function end() {
      if ( currentPromise ) {
        return currentPromise.then( this.end.bind( this ) );
      }

      if ( target && target.end ) {
        target.end();
      }

      deffered.resolve( rows );
    }

    this.each = each;
    this.map = map;
    this.reduce = reduce;
    this.then = wrappedCursorPromise.then;

    this.push = push;
    this.error = error;
    this.end = end;
    this.getPublicInterface = getPublicInterface.bind( this );
  }

  publicInterface.forEach( function interfaceReducerPrototype( functionName ) {
    CursorAsync.prototype[ functionName ] = function virtualFunction() {
      this[ functionName ].apply( this, arguments );
    };
  } );

  return CursorAsync;
} );
