## bowser-logger

![](./doc/img/browser-logger.png)

This logger can be used as a replacement for *console.log(...)* messages
that are a ubiquitous requirement when developing browser applications.

The logger has the following useful features:

* Advanced [sprintf-js] message formatting
* Use of source maps for module & line number lookup
* Integration with VSCODE, (click on a log message to open file in the editor)
* Configurable color coded messages based on INFO, WARN, ERROR, etc
* Optional message index
* Optional message timestamp

*Example output*
```
001 09:45:05 INFO setCounter(0)                   ./src/counter.ts:5
002 09:45:10 INFO setCounter(1)                   ./src/counter.ts:5
003 09:45:10 WARN Resource low                    ./src/res_mon.ts:225
```

### Usage

    npm install browser-logger

*./utils/logger.ts*
```
import { BrowserLogger, ILevel } from 'browser-logger'

const logger = new BrowserLog({
  format: '{{index}} {{timestamp}} {{title}} {{message}}{{rhs}}{{file}}:{{line}}',
  dateformat: 'HH:MM:ss'
})

export { logger, ILevel }
```

```
import { logger, ILevel } from './utils/logger'

logger.info('The index is %04d', index)
logger.warn('Add token [%s ...]', 'mytoken')

logger.setLevel(ILevel.WARN)
```

#### Source maps

To resolve module and line numbers correctly *sourcemaps* must be
enabled in the development build.

### Links

* [sprintf-js]

[sprintf-js]: https://www.npmjs.com/package/sprintf-js

