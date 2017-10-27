const fs = require('fs-extra')
const child_process = require('child_process')
const path = require('path')

class ContinuousDeployer {
  constructor(opts = {}) {
    this.options = opts  
  }

  async status() {
    let statusPath = path.join(this.options.baseDirectory, '.glitch-cd.json')
    if (await fs.pathExists(statusPath)) {
      return fs.readJson(statusPath)
    } else {
      return {}
    }
  }

  async writeStatus(status){
    let metadata = Object.assign({}, {
      timestamp: new Date(),
    }, status)
    await fs.writeFile(path.join(this.options.baseDirectory, '.glitch-cd.json'), JSON.stringify(metadata), 'utf8')
  }

  async deploy({ ref }) {
    return new Promise((resolve, reject) => {
      let respText = ''
      child_process.execFile('/usr/bin/git', ['fetch', 'origin'], { cwd: this.options.baseDirectory }, (err, result) => {
        if (err) {
          respText += err.toString()
          let status = { log: respText, error: err, status: 'error', ref }
          return this.writeStatus(status).then(() => {
            return reject(status)
          })
        }
        respText += result
        child_process.execFile('/usr/bin/git', ['reset', '--hard', ref], { cwd: this.options.baseDirectory }, (err, result) => {
          if (err) {
            respText += err.toString()
            let status = { log: respText, error: err, status: 'error', ref }
            return this.writeStatus(status).then(() => {
              return reject(status)
            })
          }

          child_process.execFile('/usr/bin/refresh', [], { cwd: this.options.baseDirectory }, (err, result) => {
            if (err) {
              respText += err.toString()
              let status = { log: respText, error: err, status: 'error', ref }
              return this.writeStatus(status).then(() => {
                return reject(status)
              })
            }
            respText += result
            let status = { log: respText, status: 'ok', ref }
            return this.writeStatus(status).then(() => {
              return resolve(status)
            })
          })
        })
      })
    })
  }
}

module.exports = ContinuousDeployer