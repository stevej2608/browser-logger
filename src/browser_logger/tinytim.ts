
// https://github.com/premasagar/tim/

export type  ILookupDict = {[token: string]: string}

/**
 * Simple template engine, see
 *
 * https://github.com/premasagar/tim/#tim
 */

export const tim = (template: string, data: Object): string => {
  const start = '{{'
  const end = '}}'
  const path = '[a-z0-9_][\\.a-z0-9_]*' // e.g. config.person.name

  const pattern = new RegExp(start + '\\s*(' + path + ')\\s*' + end, 'gi')

  return template.replace(pattern, (tag: string, token: string) => {
    const path = token.split('.')

    let lookup: ILookupDict | string = data as ILookupDict

    for (const tok of path) {

      lookup = (lookup as ILookupDict)[tok]

      if (lookup === undefined) {
        throw new Error(`tim: '${lookup}' not found in ${tag}`)
      }

    }

    return lookup as string
  })
}

