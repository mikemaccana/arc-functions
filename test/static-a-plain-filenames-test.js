let arc = require('../')
let exec = require('child_process').execSync
let exists = require('path-exists').sync
let fs = require('fs')
let join = require('path').join
let mkdir = require('mkdirp').sync
let test = require('tape')

let shared = join(process.cwd(), 'node_modules', '@architect', 'shared')

test('Init', t=> {
  t.plan(1)
  t.ok(arc, 'Loaded arc')
})

test('Set up mocked files', t=> {
  t.plan(2)
  mkdir(shared)
  fs.copyFileSync(join(__dirname, 'mock-arc'), join(shared, '.arc'))
  fs.copyFileSync(join(__dirname, 'mock-static'), join(shared, 'static.json'))
  t.ok(exists(join(shared, '.arc')), 'Mock .arc file ready')
  t.ok(exists(join(shared, 'static.json')), 'Mock static.json file ready')
})

test('Local URL tests', t=> {
  t.plan(6)
  t.equal(arc.static('index.html'), '/_static/index.html', 'Basic local static path')
  t.equal(arc.static('/index.html'), '/_static/index.html', 'Basic local static path with leading slash')
  t.equal(arc.http.helpers.static('index.html'), '/_static/index.html', 'Basic local static path (legacy)')

  process.env.NODE_ENV = 'testing'
  t.equal(arc.static('index.html'), '/_static/index.html', 'Basic local static path (env=testing)')

  process.env.NODE_ENV = 'staging'
  t.notEqual(arc.static('index.html'), '/_static/index.html', 'Basic local static path not used in staging')

  delete process.env.NODE_ENV
  process.env.ARC_STATIC_FOLDER = 'foo'
  t.equal(arc.static('index.html'), '/_static/index.html', 'Basic local static path unaffected by ARC_STATIC_FOLDER env var')
  delete process.env.ARC_STATIC_FOLDER
})

test('Staging and production URL tests', t=> {
  t.plan(5)
  process.env.AWS_REGION = 'us-west-1'
  process.env.NODE_ENV = 'production'
  t.equals(arc.static('index.html'), 'https://a-production-bucket.s3.us-west-1.amazonaws.com/index.html', 'Production URL matches')
  t.equals(arc.http.helpers.static('index.html'), 'https://a-production-bucket.s3.us-west-1.amazonaws.com/index.html', 'Production URL matches (legacy)')

  process.env.NODE_ENV = 'staging'
  t.equals(arc.static('index.html'), 'https://a-staging-bucket.s3.us-west-1.amazonaws.com/index.html', 'Staging URL matches')

  process.env.ARC_STATIC_BUCKET = 'a-totally-different-bucket'
  t.equals(arc.static('index.html'), 'https://a-totally-different-bucket.s3.us-west-1.amazonaws.com/index.html', 'ARC_STATIC_BUCKET env var populates and matches')

  process.env.ARC_STATIC_FOLDER = 'a-folder'
  t.equals(arc.static('index.html'), 'https://a-totally-different-bucket.s3.us-west-1.amazonaws.com/a-folder/index.html', 'ARC_STATIC_FOLDER env var populates and matches')
})

test('Clean up env', t=> {
  t.plan(1)
  delete process.env.ARC_STATIC_BUCKET
  delete process.env.ARC_STATIC_FOLDER
  delete process.env.AWS_REGION
  process.env.NODE_ENV = 'testing'
  exec(`rm -rf ${shared}`)
  t.ok(!exists(shared), 'Mocks cleaned up')
})
