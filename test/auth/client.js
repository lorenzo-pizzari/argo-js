const {expect} = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../../index').server
const validate = require('../../auth/client').validate

let testUser = {
  email: 'auth@test.it',
  password: 'password'
}
let testClient

lab.experiment('Client Authentication', () => {
  lab.before(async () => {
    const testUserResponse = await server.inject({
      method: 'POST',
      url: '/api/user',
      payload: testUser
    })
    testUser._id = testUserResponse.result._id
    const testClientResponse = await server.inject({
      method: 'POST',
      url: '/api/client',
      payload: {
        name: 'testAuthApp',
        redirect_uri: 'http://localhost:1234'
      },
      credentials: testUser
    })
    testClientResponse.result._id = testClientResponse.result._id.toString()
    testClient = testClientResponse.result
  })

  lab.test('should fail if client not exists', async () => {
    const result = await validate(server, 'wrongFormat', testClient.secret)
    expect(result.isValid).to.be.equal(false)
    expect(result.credentials).to.be.equal(undefined)
  })

  lab.test('should fail if client not exists', async () => {
    const result = await validate(server, testClient._id.split('').reverse().join(''), testClient.secret)
    expect(result.isValid).to.be.equal(false)
    expect(result.credentials).to.be.equal(undefined)
  })

  lab.test('should fail with wrong secret', async () => {
    const result = await validate(server, testClient._id, 'wrongSecret')
    expect(result.isValid).to.be.equal(false)
    expect(result.credentials).to.be.equal(undefined)
  })

  lab.test('should pass with correct credentials', async () => {
    const result = await validate(server, testClient._id, testClient.secret)
    expect(result.isValid).to.be.equal(true)
    expect(result.credentials.name).to.be.equal(testClient.name)
  })

  lab.after(() => {
    server.mongo.db.collection('users').deleteMany({email: 'auth@test.it'})
    server.mongo.db.collection('clients').deleteMany({name: 'testAuthApp'})
  })
})
