const {expect} = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../../index').server

lab.experiment('User', () => {
  lab.before(() => {
    return new Promise((resolve, reject) => {
      server.events.on('start', () => {
        resolve()
      })
    })
  })
  lab.test('add', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/user'
    })
    expect(response.statusCode).to.be.equal(400)
    expect(JSON.parse(response.payload)).to.be.object()
  })
})
