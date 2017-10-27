const bodyParser = require('body-parser')

const express = require('express')
let router = express.Router()
const ContinuousDeployer = require('./lib')

module.exports = (opts = {}) => {

  let options = Object.assign({}, {
    baseDirectory: process.cwd()
  }, opts)

  // Ensure you've set the secret
  const glitchCdSecret = process.env.GLITCH_CD_SECRET
  if (glitchCdSecret === undefined) {
    console.error('Please define `GLITCH_CD_SECRET` in your `.env` file.')
    process.exit(1)
  }

  let ensureAuthorization = (req, res, next) => {
    if (req.query.secret !== glitchCdSecret) {
      res.json(401, { error: { message: 'Your secret is invalid' } })
      return
    }
    next()
  }

  router.use(bodyParser.json())

  router.get('/_glitch-cd/status', ensureAuthorization, async (req, res, next) => {
    let continuousDeployer = new ContinuousDeployer(options)
    return res.json(continuousDeployer.status())
  })

  router.post('/_glitch-cd/deploy', ensureAuthorization, async (req, res, next) => {
    let ref = req.body.ref
    let continuousDeployer = new ContinuousDeployer(options)
    try {
      let resp = await continuousDeployer.deploy({ ref })
      res.json(resp)
    } catch (e) {
      res.json(500, e)
    }
  })
  return router
}
