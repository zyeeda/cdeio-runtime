import path from 'path'

import R from 'ramda'
import locale from 'koa-locale'
import i18n from 'koa-i18n'

import config from '../../config'
import logger from '../../logger'

export default (app) => {
  logger.info(`Setup ${path.basename(__filename, '.js')} hook.`)

  const options = {
    directory: path.join(config.get('appPath'), 'locales'),
    locales: ['en', 'zh-CN'],
    extension: '.json',
    modes: [
      'header',
      'tld',
      'subdomain',
      'url',
      'cookie',
      'query'
    ]
  }

  locale(app)
  app.use(i18n(app, R.merge(options, config.get('hooks:i18n'))))
}
