const {expect} = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../../index').server

let testUser = {
  email: 'test@test.it'
}

let injectConf = {
  method: 'POST',
  url: '/api/user'
}

lab.experiment('User', () => {
  lab.before(() => {
    return new Promise((resolve, reject) => {
      server.events.on('start', () => {
        resolve()
      })
    })
  })
  lab.test('shouldn\'t be added without payload', async () => {
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(400)
    expect(JSON.parse(response.payload)).to.be.object()
  })

  lab.test('shouldn\'t be added with missing required key', async () => {
    injectConf.payload = testUser
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(400)
  })

  lab.test('should be added with email + password', async () => {
    testUser.password = 'password'
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(200)
  })

  lab.test('should not add twice', async () => {
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(403)
  })

  lab.after(() => {
    server.mongo.db.collection('users').deleteOne({email: 'test@test.it'})
  })
})
