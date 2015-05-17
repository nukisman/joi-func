/**
 * Created by Alexander Nuikin (nukisman@gmail.com) on 17.05.15.
 */
var Joi = require('joi')
var JoiFunc = require('./lib/') // require('joi-func')
var assert = require('assert')

// Function call metadata
var meta = {
    args: [ // Array of argument schemas (optional)
        Joi.number().required(),
        Joi.string().optional()
    ],
    return: Joi.bool().required() // Schema of return value (optional)
}
// And schema with metadata
var schema = Joi.func().required().meta(meta)

var f

// Wrap your function with created schema
f = JoiFunc(schema, function(n, s) {
    return s.length > n
})
// or just using call metadata
f = JoiFunc(meta, function(n, s) {
    return s.length > n
})

assert(f(2, 'abc'))
assert(f(2, 'abc', 'ignored'))

// ValidationError: Too less arguments passed to function
//f(10)

// ValidationError: Invalid argument: "value" must be a number: xxx
//f('xxx', 'abc')

// ValidationError: Invalid argument: "value" must be a string: 123
//f(10, 123)

f = JoiFunc(schema, function(n, s) {
    return 'NOT BOOL'
})

// ValidationError: Invalid return: "value" must be a boolean: NOT BOOL
//f(10, 'abc')

// Methods with 'this' binding also works
var obj = {
    field: 'xxx',
    method: JoiFunc(schema, function(n, s) {
        return (s + this.field).length > n
    })
}
assert(obj.method(2, 'abc'))
assert(obj.method(10, 'abc') == false)