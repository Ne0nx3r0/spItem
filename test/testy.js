"use strict";

class Testy{
    constructor(){
        this._passes = 0;
        this._fails = 0;

        console.log('\nTESTY LOADED\n');
    }

    assert(title,expression,expectEquals){
        if(expression == expectEquals){
            this._passes++;
            console.log('PASS: ' + title);
        }
        else{
            this._fails++;
            console.error('\nFAIL: '+title
            +'\nExpected: '+expectEquals
            +'    Actual: '+expression
            );
        }
    }

    done(){
        console.log(
            '\nTESTS COMPLETE\n'
            +'\nPASSED: '+this._passes
            +'\nFAILED: '+this._fails
        );

        if(this._fails > 0){
            console.error('\nNOT ALL TESTS PASSED\n');
        }
        else{
            console.log('\nALL TESTS PASSED\n');
        }
    }
}

module.exports = Testy;