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

lab.experiment('/api/user', () => {
  lab.test('should not POST without payload', async () => {
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(400)
    expect(JSON.parse(response.payload)).to.be.object()
  })

  lab.test('should not POST with missing required key', async () => {
    injectConf.payload = {email: testUser.email}
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(400)
  })

  lab.test('should POST with email + password', async () => {
    testUser.password = 'password'
    injectConf.payload.password = testUser.password
    const response = await server.inject(injectConf)
    testUser._id = server.mongo.ObjectID(JSON.parse(response.payload)._id)
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
  })

  lab.test('should PUT user.name', async () => {
    injectConf.method = 'PUT'
    injectConf.payload = {name: 'TestName'}
    testUser.password = 'password'
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(200)
    expect(JSON.parse(response.payload).name).to.be.equal(injectConf.payload.name)
  })

  lab.test('should DELETE user', async () => {
    injectConf.method = 'DELETE'
    delete injectConf.payload
    const response = await server.inject(injectConf)
    expect(response.statusCode).to.be.equal(204)
  })

  lab.after(() => {
    server.mongo.db.collection('users').deleteOne({email: 'test@test.it'})
  })
})
