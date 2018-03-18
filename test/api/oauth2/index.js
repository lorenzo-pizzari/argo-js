const {expect} = require('code')
const Lab = require('lab')
const URL = require('url').URL
const lab = exports.lab = Lab.script()

const server = require('../../../index').server

const testUser = {
  email: 'oauthtest@test.it',
  password: 'password'
}

let testClient = {
  name: 'testOauthApp',
  redirect_uri: 'http://localhost:8000/callback'
}

let testCode

lab.experiment('OAuth2', () => {
  lab.before(async () => {
    const testUserResponse = await server.inject({
      method: 'POST',
      url: '/api/user',
      payload: testUser
    })
    testUser._id = testUserResponse.result._id
    const response = await server.inject({
      method: 'POST',
      url: '/api/client',
      payload: testClient,
      credentials: testUser
    })
    testClient._id = response.result._id
  })
  lab.test('GET auth should redirect to uri w/ error if validationError = true', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/oauth2/authorize?redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback',
      credentials: testUser
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8000/callback?redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback&error=invalid_request')
  })

  lab.test('GET auth should redirect to home if !redirect_uri', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/oauth2/authorize',
      credentials: testUser
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('/?error=invalid_request')
  })

  lab.test('GET auth should redirect to uri w/ error if !client_id', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/oauth2/authorize?response_type=code&client_id=5a9a8819e3ee417e180f74c9&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback',
      credentials: testUser
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8000/callback?error=invalid_request')
  })

  lab.test('GET auth should redirect to uri w/ error & state if !client_id', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/oauth2/authorize?response_type=code&client_id=5a9a8819e3ee417e180f74c9&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback&state=testState',
      credentials: testUser
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8000/callback?error=invalid_request&state=testState')
  })

  lab.test('GET auth should redirect to uri w/ error if redirect mismatch', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/oauth2/authorize?response_type=code&client_id=' + testClient._id + '&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcb',
      credentials: testUser
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8080/cb?error=invalid_request')
  })

  lab.test('GET auth should redirect to uri w/ error and state if redirect mismatch', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/oauth2/authorize?response_type=code&client_id=' + testClient._id + '&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcb&state=testState',
      credentials: testUser
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8080/cb?error=invalid_request&state=testState')
  })

  lab.test('GET success scenario', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/oauth2/authorize?response_type=code&client_id=' + testClient._id + '&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback',
      credentials: testUser
    })
    expect(response.statusCode).to.be.equal(200)
  })

  lab.test('POST auth should redirect to uri w/ error if validationError = true', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/authorize?redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback',
      credentials: testUser,
      payload: {decision: 'accept'}
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8000/callback?redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback&error=invalid_request')
  })

  lab.test('POST auth should redirect to home if !redirect_uri', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/authorize',
      credentials: testUser
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('/?error=invalid_request')
  })

  lab.test('POST auth should redirect to uri w/ error if decision = deny', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/authorize?response_type=code&client_id=' + testClient._id + '&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback',
      credentials: testUser,
      payload: {decision: 'deny'}
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8000/callback?error=access_denied')
  })

  lab.test('POST auth should redirect to uri w/ error & state if decision = deny', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/authorize?response_type=code&client_id=' + testClient._id + '&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback&state=testState',
      credentials: testUser,
      payload: {decision: 'deny'}
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8000/callback?error=access_denied&state=testState')
  })

  lab.test('POST auth should redirect to uri w/ error if !client_id', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/authorize?response_type=code&client_id=5a9a8819e3ee417e180f74c9&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback',
      credentials: testUser,
      payload: {decision: 'allow'}
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8000/callback?error=invalid_request')
  })

  lab.test('POST auth should redirect to uri w/ error & state if !client_id', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/authorize?response_type=code&client_id=5a9a8819e3ee417e180f74c9&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback&state=testState',
      credentials: testUser,
      payload: {decision: 'allow'}
    })
    expect(response.statusCode).to.be.equal(302)
    expect(response.headers.location).to.be.equal('http://localhost:8000/callback?error=invalid_request&state=testState')
  })

  lab.test('POST auth success scenario', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/authorize?response_type=code&client_id=' + testClient._id + '&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback',
      credentials: testUser,
      payload: {decision: 'allow'}
    })
    const responseUrl = new URL(response.headers.location)
    const testUrl = new URL(testClient.redirect_uri)
    expect(response.statusCode).to.be.equal(302)
    expect(responseUrl.host).to.be.equal(testUrl.host)
    expect(responseUrl.pathname).to.be.equal(testUrl.pathname)
    testCode = responseUrl.searchParams.get('code')
  })

  lab.test('POST auth success scenario w/ state', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/authorize?response_type=code&client_id=' + testClient._id + '&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback&state=testState',
      credentials: testUser,
      payload: {decision: 'allow'}
    })
    const responseUrl = new URL(response.headers.location)
    const testUrl = new URL(testClient.redirect_uri)
    expect(response.statusCode).to.be.equal(302)
    expect(responseUrl.host).to.be.equal(testUrl.host)
    expect(responseUrl.pathname).to.be.equal(testUrl.pathname)
    expect(responseUrl.searchParams.get('state')).to.be.equal('testState')
  })

  lab.test('POST Token validation error', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/token',
      credentials: testClient,
      payload: {
        redirect_uri: testClient.redirect_uri,
        grant_type: 'authorization_code',
        client_id: testClient._id
      }
    })
    expect(response.statusCode).to.be.equal(400)
    console.log(response.result)
    expect(response.result.error).to.be.equal('invalid_request')
  })

  lab.test('POST Token success scenario', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/oauth2/token',
      credentials: testClient,
      payload: {
        redirect_uri: testClient.redirect_uri,
        code: testCode,
        grant_type: 'authorization_code',
        client_id: testClient._id
      }
    })
    expect(response.statusCode).to.be.equal(200)
    expect(response.result).to.be.object()
  })

  lab.after(() => {
    server.mongo.db.collection('clients').deleteMany({name: testClient.name})
    server.mongo.db.collection('users').deleteMany({email: testUser.email})
    server.mongo.db.collection('tokens').deleteMany({client_id: testClient._id})
  })
})
