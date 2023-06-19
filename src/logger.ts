import { BrowserLog } from './browser_logger/BrowserLog'

export const logger = new BrowserLog({
  format: '{{index}} {{timestamp}} {{title}} {{message}}{{rhs}}{{file}}:{{line}}',
  dateformat: 'HH:MM:ss',
  charactersPerLine: () => 120,
})

