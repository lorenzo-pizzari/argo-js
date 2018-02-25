const {expect} = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../../index').server
const validate = require('../../auth/basic').validate

const testUser = {
  email: 'auth@test.it',
  password: 'password'
}

lab.experiment('Basic Authentication', () => {
  lab.before(() => {
    return server.inject({
      method: 'POST',
      url: '/api/user',
      payload: testUser
    })
  })

  lab.test('should fail if user not exists', async () => {
    const result = await validate(server, 'not@exists.com', 'password')
    expect(result.isValid).to.be.equal(false)
    expect(result.credentials).to.be.equal(undefined)
  })

  lab.test('should fail with wrong password', async () => {
    const result = await validate(server, testUser.email, 'wrongPassword')
    expect(result.isValid).to.be.equal(false)
    expect(result.credentials).to.be.equal(undefined)
  })

  lab.test('should pass with correct credentials', async () => {
    const result = await validate(server, testUser.email, testUser.password)
    expect(result.isValid).to.be.equal(true)
    expect(result.credentials.email).to.be.equal(testUser.email)
  })

  lab.after(() => {
    server.mongo.db.collection('users').deleteMany({})
  })
})
