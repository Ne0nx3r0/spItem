"use strict";

class TestyOld{
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

class Fail{
    constructor(expected,actual){
        this.expected = expected;
        this.actual = actual;
    }
}

//chained from expect
const toBe = (expected)=>{
    if(this.actual !== expected){
        throw new Fail(expected,this.actual);
    };
}

//chained from expect
const toEqual = (expected)=>{
    if(this.actual != expected){
        throw new Fail(expected,this.actual);
    };
}

//chained from expect
const toBeDefined = (expected)=>{
    if(this.actual != undefined){
        throw new Fail('<defined>',this.actual);
    };
}

//chains to toBe
const expect = (actual)=>{
    this.actual = actual;

    return {
        actual: actual,
        toBe: toBe.bind(this),
        toEqual: toEqual.bind(this),
        toBeDefined: toBeDefined.bind(this)
    };
}

const it = (testTitle,testFunc)=>{
    let _fail;

    try{
        testFunc();
    }
    catch(ex){
        if(ex instanceof Fail){
            _fail = '   '+testTitle+': FAILED - Expected: '+ex.expected+' Actual: '+ex.actual;
        }
        else{
            throw ex;
            //_fail = '   '+testTitle+': ERRORED - '+ex;
        }
    }

    if(_fail){
        console.error(_fail);
    }
    else{
        console.log('    '+testTitle+': PASSED');
    }
}

const describe = (suiteTitle,suiteFunc)=>{
    console.log(suiteTitle);

    let _fail;

    try{
        suiteFunc();
    }
    catch(ex){
        if(_fail instanceof Fail){
            _fail = 'SUITE FAILED - '+ex;
        }
        else{
            throw ex;
        }
    }

    if(_fail){
        console.error(_fail);
    }
}

module.exports = {
    describe:describe,
    it:it,
    expect:expect
}