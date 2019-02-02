const path = require('path')

const easyvk = require('..')

const DEFAULT_SESSION_PATH = path.join(__dirname, '.vk-session')

const { CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN } = process.env

describe('This test running an application authentication (Client Credentials Flow)', function () {
  function testAsync (runAsync) {
    return (done) => {
      runAsync().then(done, e => { fail(e); done() })
    }
  }

  if (!CLIENT_SECRET || !CLIENT_ID) {
    it('Test was stopped because no have a env.CLIENT_ID and env.CLIENT_SECRET tokens', () => {

    })

    return
  }

  it('checking session', testAsync(async function () {
    let vk = await easyvk({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      session_file: process.env['session-path'] || DEFAULT_SESSION_PATH,
      reauth: true
    })

    expect(vk.session).toBeDefined()

    expect(vk.session.credentials_flow).toBe(1)
  }))
})

describe('This test running a user and group authentication', function () {
  if (!ACCESS_TOKEN) {
    it('Test was stopped because no have a CLIENT_ID and CLIENT_SECRET tokens', () => {

    })

    return
  }

  easyvk({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    session_file: process.env['session-path'] || DEFAULT_SESSION_PATH,
    reauth: true
  }).then(vk => {
    it('Check that session have an application id ', () => {
      expect(vk.session).toBeDefined()
      expect(vk.session.app_id).toBe(Number)
      expect(vk.session.app_title).toBe(String)
    })
  })
})
