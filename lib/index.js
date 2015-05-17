/**
 * Created by Alexander Nuikin (nukisman@gmail.com) on 16.05.15.
 */

var assert = require('assert')
var Joi = require('joi')
var _ = require('lodash')

'use strict';

module.exports = (function () {
    var joiAssert = function (value, schema, message) {
        var v = Joi.validate(value, schema)
        if (v.error != null) {
            var msgType = typeof message
            switch (msgType) {
                case 'string':
                    v.error.message = message
                    break
                case 'function':
                    v.error.message = message(v.error)
                    break
                case 'undefined': // do nothing
                    break
                default:
                    throw new Error('Invalid type of message or message function: ' + msgType)
            }
            throw v.error
        }
    }
    var joiAssertTrue = function (value, message) {
        joiAssert(value, Joi.bool().required().equal(true), message)
    }

    return function (schema, f) {
        if(!schema.isJoi) {
            schema = Joi.func().required().meta(schema)
        }
        joiAssert(f, schema)

        var callMetas = _.filter(schema._meta, function (meta) {
            return _.isArray(meta.args) || meta.return
        })
        var callMeta
        if (callMetas.length == 0) {
            callMeta = {}
        } else {
            joiAssertTrue(callMetas.length == 1, 'Ambigous call meta info')
            callMeta = callMetas[0]
        }
        callMeta.args = callMeta.args || []
        callMeta.return = callMeta.return || Joi.any()

        _.forEach(callMeta.args, function (argSchema, i) {
            joiAssertTrue(argSchema.isJoi, 'Function call meta info contains not Joi schema for arguments[' + i + ']: ' + argSchema)
        })
        var returnSchema = callMeta.return
        joiAssertTrue(returnSchema.isJoi, 'Function call meta info contains not Joi schema return value: ' + returnSchema)

        return function () {
            var args = _.toArray(arguments)
            joiAssertTrue(callMeta.args.length <= args.length, 'Too less arguments passed to function')

            _.forEach(callMeta.args, function (argSchema, i) {
                joiAssert(args[i], argSchema, function (err) {
                    return 'Invalid argument: ' + err.message + ': ' + args[i]
                })
            })
            //console.log('args:', args)
            var result = f.apply(this, args)
            joiAssert(result, returnSchema, function (err) {
                return 'Invalid return: ' + err.message + ': ' + result
            })
            return result
        }
    }
})()