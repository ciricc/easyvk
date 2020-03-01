module.exports = {
  'session_not_valid': {
    'code': 1,
    'description': 'JSON in session file is not valid',
    'ru_description': 'JSON файла сессии не имеет правильный формат'
  },
  'session_not_found': {
    'code': 2,
    'description': 'Session file is not found',
    'ru_description': 'Файл сессии не найден'
  },
  'empty_session': {
    'code': 3,
    'description': 'Session file is empty',
    'ru_description': 'Файл сессии пустой'
  },
  'empty_response': {
    'code': 4,
    'description': 'The server responsed us with empty data',
    'ru_description': 'Ответ сервера пришел пустым'
  },
  'access_token_not_valid': {
    'code': 5,
    'description': 'Access token not valid',
    'ru_description': 'Access токен не правильный'
  },
  'captcha_error': {
    'code': 6,
    'description': 'You need solve it and then put to params captcha_key, or use captchaHandler for solve it automatic',
    'ru_description': 'Необходимо решить капчу, вставьте в параметр captcha_key код с картинки или используйте captchaHandler для того, чтобы решать капчу автоматически'
  },
  'method_deprecated': {
    'code': 7,
    'description': 'This method was deprecated',
    'ru_description': 'Этот метод был удален'
  },
  'is_not_string': {
    'code': 8,
    'description': 'This parameter is not string',
    'ru_description': 'Параметр должен быть строкой'
  },
  'live_error': {
    'code': 10,
    'description': "Maybe VK algo was changed, but we can't parse count of views from this video",
    'ru_description': 'Может быть, алгоритмы ВКонтакте были изменены, но сейчас мы не можем получить количество просмотров этой странсляции'
  },
  'server_error': {
    'code': 11,
    'description': "Server was down or we don't know what happaned",
    'ru_description': 'Сервер упал, или нам неизвестно, что произошло'
  },
  'invalid_response': {
    'code': 12,
    'description': 'Server responsed us with not a JSON format',
    'ru_description': 'Сервер ответил не в формате JSON'
  },
  'is_not_object': {
    'code': 13,
    'description': 'This parameter is not an object',
    'ru_description': 'Параметр должен быть объектом'
  },
  'upload_url_error': {
    'code': 14,
    'description': 'upload_url is not defied in vk response',
    'ru_description': 'upload_url не указан в ответе сервера'
  },
  'is_not_function': {
    'code': 15,
    'description': 'This parameter is not a function',
    'ru_description': 'Параметр должен быть функцией'
  },
  'is_not_number': {
    'code': 16,
    'description': 'This parameter is not a number',
    'ru_description': 'Параметр должен быть числом'
  },
  'http_client': {
    'parent_hash': 2000,
    'errors': {
      'need_auth': {
        'code': 1,
        'description': 'Need authenticate by password and username. This data not saving in session file!',
        'ru_description': 'Вам нужно ввести параметр username и password, в сессии не сохранен пароль и логин'
      },
      'not_supported': {
        'code': 2,
        'description': 'Library does not support this authentication way... sorry',
        'ru_description': 'Библиотека не поддерживает авторизацию через HTTP... к сожалению'
      }
    }
  },
  'longpoll_api': {
    'parent_hash': 3000,
    'errors': {
      'not_connected': {
        'code': 1,
        'description': 'LongPoll not connected to the server',
        'ru_description': 'LongPoll не подключен к серверу'
      },
      'event_already_have': {
        'code': 2,
        'description': 'This eventCode is already have listening',
        'ru_description': 'Этот eventCode уже прослушивается'
      }
    }
  },
  'session': {
    'parent_hash': 3100,
    'errors': {
      'need_path': {
        'code': 1,
        'description': 'You need set path for session file',
        'ru_description': 'Вам нужно установить путь к файлу сессии'
      }
    }
  },
  'widgets': {
    'parent_hash': 4000,
    'errors': {
      'live_not_streaming': {
        'code': 1,
        'description': 'The live video is not streaming now',
        'ru_description': 'Live трансляция в данный момент не проводится'
      }
    }
  }
}
