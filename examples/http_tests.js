/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')
const _easyvk = path.join(__dirname, 'easyvk.js')
const easyVK = require(`${_easyvk}`)
const currentSessionFile = path.join(__dirname, '.vksession')

/**
 *
 * This test is testing all my Http widgets
 */
const main = async () => {
  let VKontakte = await (easyVK({
    api_v: '5.73',
    save_session: true,
    session_file: currentSessionFile,
    username: '{USERNAME}',
    password: '{PASSWORD}',
    platform: ['ios', 'android', 'windows'][0],
    lang: 'ru'
  }))

  let { client: Client } = await (VKontakte.http.loginByForm())

  const AudioAPI = Client.audio

  let { vkr: myAudios } = await (AudioAPI.get())

  let { vkr: lyricsFromFirstAdio } = await (AudioAPI.getLyrics(myAudios[0]))
  console.log(lyricsFromFirstAdio)

  let { vkr: countOfMyAudios } = await (AudioAPI.getCount())
  console.log(countOfMyAudios)

  let { vkr: foundAudios, json } = await (AudioAPI.search({
    q: 'Maroon 5'
  }))

  console.log(json, 'is a json object from audio response')

  // add new audio
  await (AudioAPI.add(foundAudios[0]))

  VKontakte.call('wall.getById', {
    posts: '-149662823_108'
  }).then(({ vkr }) => {
    let post = vkr[0]

    // console.log();
    let audio = post.attachments[1].audio

    console.log(AudioAPI.getURL(audio.url))
  })

  let { vkr: uploadUrl } = await (AudioAPI.getUploadServer())

  let { vkr: uploadedAuioObject } = await (AudioAPI.upload(
    uploadUrl.upload_url, // url for server
    path.join(__dirname, 'main.mp3') // file path
  ))

  // you can not save audio, just upload
  let { vkr: newAudio } = await (AudioAPI.save(uploadedAuioObject))
  console.log(newAudio, ' added new audio')

  // delete audio
  AudioAPI.delete(myAudios[0]).then(async () => {
    // restore audio
    console.log(myAudios[0])
    await (AudioAPI.restore(myAudios[0]))
  })

  // edit audios
  console.log(myAudios[0])
  AudioAPI.edit(myAudios[0], {
    title: 'New Title Of Audio',
    performer: 'New performer',
    text: 'New text for audio'
  })

  let { vkr: audiosGotById } = await (AudioAPI.getById({
    ids: [
      '47809103_456239660',
      '47809103_456239659',
      '47809103_456239658'
    ].join(',')
  }))

  console.log(audiosGotById, 'got audios')
}

main()

// Handle all rejects and errors
process.on('unhandledRejection', console.error)
