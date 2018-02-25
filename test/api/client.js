const {expect} = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../../index').server

let testUser = {
  email: 'test@test.it',
  password: 'password'
}

let testClient

let injectConf = {
  method: 'POST',
  url: '/api/client',
  credentials: testUser
}

lab.experiment('/api/client', () => {
  lab.before(async () => {
    return new Promise((resolve, reject) => {
      if (server.plugins['client-api']) return resolve()
      server.events.on('start', async () => {
        const UserResponse = await server.inject({
          method: 'POST',
          url: '/api/user',
          payload: testUser
        })
        testUser._id = JSON.parse(UserResponse.payload)._id
        resolve()
      })
    })
  })

  lab.test('should not POST without payload', async () => {
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(400)
    expect(JSON.parse(response.payload)).to.be.object()
  })

  lab.test('should POST with correct payload', async () => {
    injectConf.payload = {name: 'TestApp', redirect_uri: 'http://test.com/callback'}
    const response = await server.inject(injectConf)
    testClient = JSON.parse(response.payload)
    expect(testClient.name).to.be.equal(injectConf.payload.name)
    expect(testClient.redirect_uri).to.be.equal(injectConf.payload.redirect_uri)
    expect(testClient.user_id).to.be.equal(testUser._id)
    expect(response.statusCode).to.be.equal(200)
  })

  lab.test('should not POST twice', async () => {
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(403)
  })

  lab.test('should GET', async () => {
    injectConf.method = 'GET'
    delete injectConf.payload
    injectConf.credentials = testUser
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(200)
    expect(JSON.parse(response.payload)).to.be.array().and.to.have.length(1)
  })

  lab.test('should DELETE client', async () => {
    injectConf.method = 'DELETE'
    injectConf.payload = {_id: testClient._id}
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(204)
  })

  lab.after(() => {
    server.mongo.db.collection('users').deleteMany({})
    server.mongo.db.collection('clients').deleteMany({})
  })
})
