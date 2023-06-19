import { BrowserLog, LogLevel } from '../src'

export const logger = new BrowserLog({
  format: '{{index}} {{timestamp}} {{title}} {{message}}{{rhs}}{{file}}:{{line}}',
  dateformat: 'HH:MM:ss',
  charactersPerLine: () => 120,
  level: LogLevel.WARN
})

