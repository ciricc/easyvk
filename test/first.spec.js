const path = require('path')

const easyvk = require('..')

const DEFAULT_SESSION_PATH = path.join(__dirname, '.vk-session')

let { CLIENT_ID: clientId, CLIENT_SECRET: clientSecret, ACCESS_TOKEN: accessToken } = process.env

describe('This test running an application authentication (Client Credentials Flow)', function () {
  function testAsync (runAsync) {
    return (done) => {
      runAsync().then(done, e => { fail(e); done() })
    }
  }

  clientSecret = clientSecret.replace('process.env.CLIENT_SECRET', '')
  clientId = clientId.replace('process.env.CLIENT_ID', '')

  if (!clientSecret || !clientId) {
    it('Test was stopped because no have a env.CLIENT_ID and env.CLIENT_SECRET tokens', () => {

    })

    return
  }

  it('checking session', testAsync(async function () {
    let vk = await easyvk({
      client_id: clientId,
      client_secret: clientSecret,
      session_file: process.env['session-path'] || DEFAULT_SESSION_PATH,
      reauth: true
    })

    expect(vk.session).toBeDefined()

    expect(vk.session.credentials_flow).toBe(1)
  }))
})
