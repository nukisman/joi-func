# joi-func

# Install

`npm install joi-func --save`

# Usage example

```js
var Joi = require('joi')
var JoiFunc = require('joi-func')
var assert = require('assert')

var schema = Joi.func()
    .meta({
        args: [ // Array of argument schemas (optional)
            Joi.number().required(),
            Joi.string().optional()
        ],
        return: Joi.bool().required() // Schema of return value (optional)
    })

var f

f = JoiFunc(schema, function(n, s) {
    return s.length > n
})

assert(f(2, 'abc'))
assert(f(2, 'abc', 'ignored'))

//f(10) // ValidationError: Too less arguments passed to function

//f('xxx', 'abc') // ValidationError: Invalid argument: "value" must be a number: xxx
//f(10, 123) // ValidationError: Invalid argument: "value" must be a string: 123

f = JoiFunc(schema, function(n, s) {
    return 'NOT BOOL'
})

//f(10, 'abc') // ValidationError: Invalid return: "value" must be a boolean: NOT BOOL

// Methods with 'this' binding also works
var obj = {
    field: 'xxx',
    method: JoiFunc(schema, function(n, s) {
        return (s + this.field).length > n
    })
}
assert(obj.method(2, 'abc'))
assert(obj.method(10, 'abc') == false)
```