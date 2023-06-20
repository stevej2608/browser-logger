/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Minimal reworked version of tracer with source mapped line numbers
 *
 * https://www.npmjs.com/package/tracer
 * https://www.npmjs.com/package/stacktracey
 */

import StackTracey from 'stacktracey'
import dateFormat from 'dateformat'
import { sprintf } from 'sprintf-js'

import { tim } from './tinytim'
import { PromiseQueue } from './PromiseQueue'

// export enum LogLevelRange {
//   LOG = "log",
//   TRACE = "trace",
//   DEBUG = "debug",
//   INFO = "info",
//   WARN = "warn",
//   ERROR = "error",
//   FATAL = "fatal"
// }

type LogLevelRange = number

const LogLevel = {
  LOG: 1,
  TRACE: 2,
  DEBUG: 3,
  INFO: 4,
  WARN: 5,
  ERROR: 6,
  FATAL: 7,
  DISABLED: 8
}
Object.freeze(LogLevel)

type ILogTitles = 'LOG' | 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'DISABLED'

const titles: ILogTitles[] = ["LOG", "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"]

export interface ITransport {
  title: ILogTitles
  level: number
  message: string
  output: string
  timestamp: string
  index: string

  // source-maps provided

  callee: string,
  file: string,
  line: number,
  pos: number,
}

interface ILogProps {
  level: LogLevelRange
  msg: string
  index?: number
  errorStack?: Error
}

export interface Config {

  format?: string
  dateformat?: string
  indexFormat?: string

  charactersPerLine?: () => number
  preprocess?: (data: ITransport) => void
  transport?: (data: ITransport) => any

  level?: LogLevelRange
  stackIndex?: number
}


const defaultConfig: Config = {
  format: '{{timestamp}} <{{title}}>{{rhs}}{{file}}:{{line}}',
  dateformat: 'isoDateTime',
  indexFormat: "%03s",

  charactersPerLine: () => {
    return 180
  },

  preprocess: function () {
    // NO ACTION
  },

  transport: function (data: ITransport) {
    if (data.level === LogLevel.WARN) {
      queueMicrotask(console.log.bind(console, `%c${data.output}`, "color:yellow"))
    } else if (data.level > 4) {
      queueMicrotask(console.log.bind(console, `%c${data.output}`, "color:red"))
    } else {
      queueMicrotask(console.log.bind(console, data.output))
    }
  },

  level: LogLevel.INFO,
  stackIndex: 0
}

// Stack trace format :
// https://github.com/v8/v8/wiki/Stack%20Trace%20API

const stackRegex1 = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i
const stackRegex2 = /at\s+()(.*):(\d*):(\d*)/i
const stackRegex3 = /.*?@()(.*):(\d*):(\d*)/i

/**
 *
 */

class BrowserLog {

  config: Config
  needStack: boolean
  logIndex: number
  queue: PromiseQueue
  level: LogLevelRange

  constructor(userConfig: Config = {}) {
    this.config = { ...defaultConfig, ...userConfig }
    this.needStack = /{{(method|path|line|pos|file|folder|stack)}}/i.test(this.config.format)
    this.logIndex = 0
    this.queue = new PromiseQueue()
    this.level = this.level || LogLevel.INFO
  }

  /**
   * The log message passed in by the called has been expanded. We now
   * need to reference the source-maps add the internal
   * fields (index, timestamp, etc)
   *
   * This method is asynchronous due to the dynamic nature of
   * source map resolution
   *
   * @param args
   * @returns
   */

  private async logMain(args: ILogProps) {
    const { level, msg, errorStack } = args
    const config = this.config

    const data: ITransport = {
      title: titles[level - 1],
      level: level,
      message: msg,
      output: '',
      timestamp: dateFormat(new Date(), config.dateformat),
      index: sprintf(this.config.indexFormat, ++this.logIndex),

      callee: '',
      file : '',
      line: 0,
      pos: 0,
    }

    if (this.needStack) {

      // Pop the recent frames, so stackList[0] will be the
      // log message call
      //
      // Some browser stack dumps start with an error line, others don't

      const drop = errorStack.stack.startsWith('Error') ? 3 : 2

      const stackList = errorStack.stack.split('\n').slice(drop)

      // Allow user the reference higher up the stack, otherwise
      // just reference the log message call location

      const logLoc = (stackList[config.stackIndex] || stackList[0]) + '\n'

      // Use regex to split the stack location message
      //
      // "at BrowserLog.info (http://localhost:3000/src/utils/BrowserLog.ts?t=1686990478223:90:10)",
      // "BrowserLog.info",
      // "http://localhost:3000/src/utils/BrowserLog.ts?t=1686990478223",
      // "90",
      // "10",

      const locationRecord = stackRegex1.exec(logLoc) || stackRegex2.exec(logLoc) || stackRegex3.exec(logLoc)

      if (locationRecord && locationRecord.length === 5) {
        // https://www.npmjs.com/package/stacktracey?activeTab=readme

        const stack = new StackTracey(logLoc)
        const top = (await stack.withSourcesAsync()).items[0]

        data.callee = top.callee
        data.line = top.line
        data.pos = top.column
        data.file = './' + top.fileShort
      }
      else {
        console.log('Unable to decode stack:\n%s', errorStack.stack)
      }
    }

    config.preprocess(data)

    const fmt: string[] = config.format.split('{{rhs}}')

    if (fmt.length > 1) {
      const lhs: string = tim(fmt[0], data)
      const rhs: string = tim(fmt[1], data)
      const pad: number = config.charactersPerLine() - (lhs.length + rhs.length)

      data.output = `${lhs} ${rhs.padStart(pad + rhs.length, ' ')}`
    } else {
      data.output = tim(config.format, data)
    }

    config.transport(data as ITransport)
    return data
  }

  /**
   * We need queue the log messages in order of submission since
   * the resolution of the source file & line number via a source map
   * request relies on network activity. Having several simultaneous
   * request in progress could result the log messages being
   * reported in the wrong order.
   */

  private queueLogMessage(args: ILogProps) {

    if (this.needStack) {
      args.errorStack = new Error()
    }

    this.queue.enqueue(() => this.logMain(args))
      .then(() => {
        // NO ACTION
      })
      .catch(error => {
        console.log(error)
      })
  }

  public log(format: string, ...args: any[]) {
    if (LogLevel.LOG < this.level) return
    const msg = sprintf(format, ...args)
    this.queueLogMessage({ level: LogLevel.LOG, msg })
  }

  public trace(format: string, ...args: any[]) {
    if (LogLevel.TRACE < this.level) return
    const msg = sprintf(format, ...args)
    this.queueLogMessage({ level: LogLevel.TRACE, msg })
  }

  public debug(format: string, ...args: any[]) {
    if (LogLevel.DEBUG < this.level) return
    const msg = sprintf(format, ...args)
    this.queueLogMessage({ level: LogLevel.DEBUG, msg })
  }

  public info(format: string, ...args: any[]) {
    if (LogLevel.INFO < this.level) return
    const msg = sprintf(format, ...args)
    this.queueLogMessage({ level: LogLevel.INFO, msg })
  }

  public warn(format: string, ...args: any[]) {
    if (LogLevel.WARN < this.level) return
    const msg = sprintf(format, ...args)
    this.queueLogMessage({ level: LogLevel.WARN, msg })
  }

  public error(format: string, ...args: any[]) {
    if (LogLevel.ERROR < this.level) return
    const msg = sprintf(format, ...args)
    this.queueLogMessage({ level:LogLevel.ERROR, msg })
  }

  public fatal(format: string, ...args: any[]) {
    if (LogLevel.DISABLED < this.level) return
    const msg = sprintf(format, ...args)
    this.queueLogMessage({ level: LogLevel.FATAL, msg })
  }

  public setLevel(level: LogLevelRange) {
    this.level = level
  }
}

export { BrowserLog, LogLevel }
