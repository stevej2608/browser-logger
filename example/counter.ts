import { logger } from './logger'

export function setupCounter(element: HTMLButtonElement) {
  let counter = 0

  const setCounter = (count: number) => {

    logger.info('setCounter(%d)', count)
    logger.warn('setCounter(%d)', count)

    counter = count
    element.innerHTML = `count is ${counter}`
  }

  logger.info('Setup counter')
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}
