var test = require('tape')
var arc = require('../')
var cookie = require('cookie')

test('env', t=> {
  t.plan(1)
  t.ok(arc, 'gotta arc')
})
