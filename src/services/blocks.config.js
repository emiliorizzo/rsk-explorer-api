
import config from '../lib/config'
import { enabledServices } from './serviceFactory'

const scripts = Object.entries(enabledServices)
  .map(([service, name]) => name)

const scriptName = name => `${name}.js`

const cwd = `${__dirname}/blocks/`
const { log } = config

export const paths = scripts.map(name => cwd + scriptName(name))

export const apps = scripts.map(name => {
  let script = scriptName(name)
  let conf = { name, script, cwd }
  if (log && log.dir) {
    let { dir } = log
    conf.error_file = `${dir}/${name}-error.log`
    conf.out_file = `${dir}/${name}-out.log`
  }
  return conf
})
