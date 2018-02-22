const {expect} = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../index').server

lab.experiment('Server', () => {
  lab.test('HealthCheck Should Reply', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/healthCheck'
    })
    expect(response.statusCode).to.be.equal(200)
    expect(JSON.parse(response.payload)).to.be.object()
  })
})
