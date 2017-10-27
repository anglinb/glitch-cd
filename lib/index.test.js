const fs = require('fs-extra')
const child_process = require('child_process')
const path = require('path')
const ContinuousDeployer = require('./') 

let workDir = path.join(__dirname, '../test-workdir')
let dataDir = path.join(__dirname, '../test-data')
describe('deploy', () => {
  beforeEach(async () => {
    await fs.remove(workDir)
    await fs.copy(dataDir, workDir)
  }) 
  test('test deployment checks out right commit', async () => {
    let deployer = new ContinuousDeployer({ baseDirectory: workDir })
    try {
      let { log, status} = await deployer.deploy({ ref: 'b73e47ed5ecc4ce1f6b3e790cfb1a247a3916256' })
      expect(log).toBeTruthy()
      let gitSha = await new Promise((resolve, reject) => {
        child_process.execFile('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: workDir }, (err, result) => {
          resolve(result)
        })
      }) 
      expect(gitSha.replace(/\n$/, '')).toEqual('b73e47ed5ecc4ce1f6b3e790cfb1a247a3916256')
      let diskStatus = await fs.readJSON(path.join(workDir, '.glitch-cd.json'))
      expect(diskStatus.status).toEqual('ok')
      expect(diskStatus.ref).toEqual('b73e47ed5ecc4ce1f6b3e790cfb1a247a3916256')
      expect(new Date(diskStatus.timestamp) < new Date()).toBeTruthy()
    } catch (e) {
      console.log('ERROR', e)
      expect(false).toBeTruthy()
    }
  })
})

describe('status', () => {
  beforeEach(async () => {
    await fs.remove(workDir)
    await fs.mkdir(workDir);
  })
  test('when no file exists', async () => {
    let deployer = new ContinuousDeployer({ baseDirectory: workDir })
    let status = await deployer.status()
    expect(status).toEqual({})
  })
  test('when file exists', async () => {
    let metadata = { log: 'some logs', status: 'ok', ref:'13' }
    await fs.writeFile(path.join(workDir, '.glitch-cd.json'), JSON.stringify(metadata), 'utf8')
    let deployer = new ContinuousDeployer({ baseDirectory: workDir })
    let status = await deployer.status()
    expect(status).toEqual(metadata)
  })
})
