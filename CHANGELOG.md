#Changelog

This file started from 0.2.8 version.
So, in older versions you need see changes in a commits.

## [0.3.12] - 2018-02-18

### Added 
- Added 2 parameter in callback function for StreamingAPI. Now, you can get access_token before WeSocket connection inited.

## [0.3.11] - 2018-02-18

### Added
- Link on our community group
- Created our community group

### Changed
- api_v default parameter. Now is 5.73 version
- Readme file

## [0.3.1] 

### Changed
- Comments in scripts
- Corrected readme
- Corrected changelog

## [0.3.0]

### Added
- CallbackAPI support (tested on heroku server)
- package.json file, added must have node version

### Changed

- Fixed auth with group access token. VK APi was updated from uid to user_id 
- All functions like longpoll(), StreamingAPI(), CallbackAPI() now is asynchronous
- Changed api_v in README file (5.73)
- Fixed package.json

## [0.2.81]

### Changed
- Fixed video streaming error, when live stream there is no, but programmer try to get views. In older version it can throw error and stop your script. It solved.
- Removed "UUURAA!!" in console's  log

## [0.2.8]

### Added
- New event type for longpoll - close (Arises when connection closed by .close() method)

### Changed
- Fixed StreamingAPI. When you may be tried delete many rules, there was a mistake "vk response undefined". Now this problem solved and it works normal.
- Fixed api_v parameter. Previously, this parameter could not be changed, because of the shortcomings in the code. Now this problem solved.
- Fixed longpoll connection
- Fixed tests examples
- All quieries will be send with &v=api_v parameter (beacouse in febr of 2018, VK API was updated)
- VK API version on 5.71
