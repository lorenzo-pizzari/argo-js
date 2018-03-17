const {expect} = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../../index').server
const validate = require('../../auth/cookie').validate

let testUser = {
  email: 'auth@test.it',
  password: 'password'
}

let testUserId

lab.experiment('Session Authentication', () => {
  lab.before(async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/user',
      payload: testUser
    })
    testUserId = response.result._id.toString()
  })

  lab.test('GET /login should render login page if not authenticated', async () => {
    const response = await server.inject({method: 'GET', url: '/login'})
    expect(response.statusCode).to.be.equal(200)
  })

  lab.test('POST /login should redirect to login if is not authenticated', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/login',
      payload: {email: 'wrong@email.com', password: 'password'}
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('/login?status=Unauthorized')
    expect(response.headers['set-cookie']).to.be.undefined()
  })

  lab.test('POST /login should not duplicate status query param', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/login?status=Unauthorized',
      payload: {email: 'wrong@email.com', password: 'password'}
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('/login?status=Unauthorized')
    expect(response.headers['set-cookie']).to.be.undefined()
  })

  lab.test('POST /login should redirect to home if is authenticated', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/login',
      payload: testUser
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('/')
    expect(response.headers['set-cookie']).to.be.array()
  })

  lab.test('POST /login should redirect to next if is set', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/login?next=/nextPage',
      payload: testUser
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('/nextPage')
    expect(response.headers['set-cookie']).to.be.array()
  })

  lab.test('GET /login should redirect to home if is authenticated', async () => {
    const response = await server.inject({method: 'GET', url: '/login', credentials: testUser})
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('/')
  })

  lab.test('GET /login should redirect to next if is set', async () => {
    const response = await server.inject({method: 'GET', url: '/login?next=/nextPage', credentials: testUser})
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('/nextPage')
  })

  lab.test('validation function should fail with wrong token', async () => {
    const validation = await validate({server: server}, {sid: 'notExistingToken'})
    expect(validation.valid).to.be.false()
    expect(validation.credentials).to.be.undefined()
  })

  lab.test('validation function should pass with correct token', async () => {
    const validation = await validate({server: server}, {sid: testUserId})
    expect(validation.valid).to.be.true()
    expect(validation.credentials).to.be.object()
  })

  lab.after(() => {
    server.mongo.db.collection('users').deleteMany({email: 'auth@test.it'})
  })
})
