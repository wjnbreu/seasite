/*
 * Copyright (C) 2018 Dirk Holtwick <https://holtwick.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// @flow
// @jsx jsx

import {handleLinks} from '../index'
import {walkSync} from '../site/fileutil'
import {jsx} from '../site/jsx'
import {SeaSite} from '../site/site'

let defaults = {
    exclude: [
        '404.html',
    ],
    pattern: /\.html/,
    handler($, path) {
    },
}

export function sitemap(site: SeaSite, opt: Object = {}) {
    opt = Object.assign({}, defaults, opt)

    let sitemap = []
    site.handle(opt.pattern, ($, path) => {

        // Exclude?
        for (let pattern of opt.exclude) {
            if (typeof pattern === 'string') {
                if (path.indexOf(pattern) === 0) {
                    return
                }
            }
            else if (pattern instanceof RegExp) {
                pattern.lastIndex = 0
                if (pattern.test(path)) {
                    return
                }
            }
        }

        opt.handler($, path)

        let url = site.publicURL(path)
        sitemap.push(url)
    })

    sitemap.sort()
    site.write('sitemap.txt', sitemap.join('\n'))

    site.write('robots.txt', `User-agent: *\nSitemap: ${site.publicURL('sitemap.txt')}`)
}