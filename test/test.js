/**
 * Created by Alexander Nuikin (nukisman@gmail.com) on 16.05.15.
 */

var Joi = require('joi')
var JoiFunc = require('../lib/')
var should = require('should')

var schema = Joi.func()
    .meta({
        args: [ // array of argument schemas, not alternative shorthand
            Joi.number().required(),
            Joi.string().optional()
        ],
        return: Joi.bool().optional()
    })

//console.log('schema:', schema)

var shouldError = function (message) {
    return function (err) {
        should(err).exists
        err.should.have.property('name').eql('ValidationError')
        err.should.have.property('message').eql(message)
        return true
    }
}

it('Ok', function () {
    JoiFunc(schema, function (n, s) {
        return s.length > n
    })(10, 'abc')
})

it('This binding', function () {
    var obj = {
        field: 'abc',
        long: function (n, s) {
            //console.log('long: this.field:', this.field)
            return (s + this.field).length > n
        },
        short: JoiFunc(schema, function (n, s) {
            //console.log('short: this.field:', this.field)
            return (s + this.field).length > n
        })
    }
    obj.long = JoiFunc(schema, obj.long)
    obj.long(10, 'abc').should.be.eql(false)
    obj.long(10, 'abc1234567').should.be.eql(true)

    obj.short(10, 'abc').should.be.eql(false)
    obj.short(10, 'abc1234567').should.be.eql(true)

    var obj2 = {
        field: 'abcdefgh'
    }

    var bound = obj.short.bind(obj2)
    bound(10, 'abc').should.be.eql(true)
})

describe('Meta', function () {
    it('No', function () {
        var schema = Joi.func() // No call validation
        JoiFunc(schema, function (n, s) {
            return s.length > n
        })(10, 'abc')
    })

    it('Ambigous', function () {
        should.throws(function () {
            var schema = Joi.func()
                .meta({
                    args: [
                        Joi.number()
                    ],
                    return: Joi.bool()
                })
                .meta({
                    args: [
                        Joi.number()
                    ],
                    return: Joi.bool()
                })
            JoiFunc(schema, function () {
                throw new Error('Never be thrown')
            })()
        }, shouldError('Ambigous call meta info'))
    })

    it('Args only', function () {
        should.throws(function () {
            var schema = Joi.func()
                .meta({
                    args: [ // array of argument schemas, not alternative shorthand
                        Joi.number().required(),
                        Joi.string().required()
                    ]
                })
            JoiFunc(schema, function (n, s) {
                throw new Error('Never be thrown')
            })(10, 123)
        }, shouldError('Invalid argument: "value" must be a string: 123'))
    })
    it('Return only', function () {
        should.throws(function () {
            var schema = Joi.func()
                .meta({
                    return: Joi.bool().required()
                })
            JoiFunc(schema, function () {
                return 'NOT BOOL'
            })(10, 123)
        }, shouldError('Invalid return: "value" must be a boolean: NOT BOOL'))
    })
})

describe('Args', function () {
    it('Not Joi Schema', function () {
        should.throws(function () {
            var schema = Joi.func()
                .meta({
                    args: [ // array of argument schemas, not alternative shorthand
                        Joi.number().required(),
                        'NOT JOI SCHEMA'
                    ],
                    return: Joi.bool().optional()
                })
            JoiFunc(schema, function () {
                throw new Error('Never be thrown')
            })()
        }, shouldError('Function call meta info contains not Joi schema for arguments[1]: NOT JOI SCHEMA'))
    })
    it('Less', function () {
        should.throws(function () {
            JoiFunc(schema, function (n, s) {
                throw new Error('Never be thrown')
            })()
        }, shouldError('Too less arguments passed to function'))
    })
    it('Extra', function () {
        JoiFunc(schema, function (n, s) {
            return s.length > n
        })(10, 'abc', 'ignored')
    })
    it('Invalid', function () {
        should.throws(function () {
            JoiFunc(schema, function (n, s) {
                throw new Error('Never be thrown')
            })(10, 123)
        }, shouldError('Invalid argument: "value" must be a string: 123'))
    })
})

describe('Return', function () {
    it('Not Joi Schema', function () {
        should.throws(function () {
            var schema = Joi.func()
                .meta({
                    args: [ // array of argument schemas, not alternative shorthand
                        Joi.number().required(),
                        Joi.string().required()
                    ],
                    return: 'NOT JOI'
                })
            JoiFunc(schema, function () {
                throw new Error('Never be thrown')
            })()
        }, shouldError('Function call meta info contains not Joi schema return value: NOT JOI'))
    })
    it('Invalid', function () {
        should.throws(function () {
            JoiFunc(schema, function (n, s) {
                return 'lalala'
            })(10, 'abc')
        }, shouldError('Invalid return: "value" must be a boolean: lalala'))
    })
})