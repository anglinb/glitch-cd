const fs = require('fs-extra')
const path = require('path')
const child_process = require('child_process')
const request = require('supertest')
const express = require('express')
const middlewareFactory = require('./')

process.env.GLITCH_CD_SECRET = 'secret'

let app
let middleware
let workDir = path.join(__dirname, 'test-workdir')
let dataDir = path.join(__dirname, 'test-data')
beforeEach(async () => {
  middleware = middlewareFactory({ baseDirectory: workDir})
  app = express()
  app.use(middleware)
  await fs.remove(workDir)
  await fs.copy(dataDir, workDir)
})

test('deploy at ref', async () => {
  let response = await request(app)
    .post('/_glitch-cd/deploy?secret=secret')
    .send({ ref: 'b73e47ed5ecc4ce1f6b3e790cfb1a247a3916256' })
    .expect(200)
  expect(response.body.status).toEqual('ok')
  let gitSha = await new Promise((resolve, reject) => {
    child_process.execFile('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: workDir }, (err, result) => {
      resolve(result)
    })
  }) 
  expect(gitSha.replace(/\n$/, '')).toEqual('b73e47ed5ecc4ce1f6b3e790cfb1a247a3916256')
})
