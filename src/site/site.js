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

// @jsx html
// @flow

const fs = require('fs')
const fsx = require('fs-extra')
const path = require('path')
// const process = require('process')

import {dom, isDOM} from './dom'
import {jsx, prependXMLIdentifier} from './jsx'
// import {absoluteLinks} from './relativeurls'
import {rmdir, mkdir, walkSync} from './fileutil'

import log from '../log'

type SeaSitePattern = string | RegExp | Array<string | RegExp>

// This is required to bypass systems umask settings
process.umask(0o022)

export function isPattern(pattern: ?SeaSitePattern): boolean {
    return pattern != null && (
        pattern instanceof RegExp ||
        typeof pattern === 'string' ||
        Array.isArray(pattern))
}

export function pathMatchesPatterns(path: string, patterns: SeaSitePattern): boolean {
    if (!Array.isArray(patterns)) {
        patterns = [patterns]
    }
    for (let pattern of patterns) {
        if (typeof pattern === 'string') {

            // Strip leading /
            if (pattern.indexOf('/') === 0) {
                pattern = pattern.substring(1)
            }

            // Match folder ?
            if (pattern[pattern.length - 1] === '/') {
                if (path.indexOf(pattern) === 0) {
                    return true
                }
            }
            else if (path === pattern) {
                return true
            }
        }
        else if (pattern instanceof RegExp) {
            pattern.lastIndex = 0
            if (pattern.test(path)) {
                return true
            }
        }
    }
    return false
}

export function filterByPatterns(paths: ?Array<string>, patterns: ?SeaSitePattern, exclude: ?SeaSitePattern): Array<string> {
    return (paths || [])
        .filter(file => {
            if (pathMatchesPatterns(file, patterns || [])) {
                if (isPattern(exclude)) {
                    return !pathMatchesPatterns(file, exclude || [])
                }
                return true
            }
            return false
        })
}

// const LOAD_OPTIONS = {
//     normalizeWhitespace: true,
// }

export class SeaSite {

    opt: Object
    basePath: string

    constructor(srcPath: string, basePath: ?string = null, opt: Object = {
        excludePatterns: null,
        includePatterns: null,
        baseURL: '',
    }) {
        log.setLevel(opt.logLevel || log.INFO)

        this.opt = opt
        if (basePath == null) {
            this.basePath = srcPath
        } else {
            this.basePath = basePath

            // Filter files
            let files = filterByPatterns(
                walkSync(srcPath),
                opt.includePatterns,
                opt.excludePatterns)

            // Remove old site copy
            rmdir(basePath)
            mkdir(basePath)

            // Copy site
            log.info(`Site creation ... ${srcPath} -> ${basePath}`)
            for (let file of files) {
                let src = path.join(srcPath, file)
                let dst = path.join(basePath, file)
                let data = fs.readFileSync(src)
                mkdir(path.dirname(dst))
                // this.log(`  cloned ... ${dst}`)
                fs.writeFileSync(dst, data, {
                    mode: 0o644,
                })
            }
            //     // Paths
            //     let pages = [];
            //     for (let filePath of files) {
            //         let page = {
            //             url: '/' + filePath,
            //             outUrl: '/' + filePath,
            //             name: path.basename(filePath).replace(/\.[^\.]+$/, ''),
            //             dirName: path.dirname(filePath),
            //             fileName: path.basename(filePath),
            //             inPath: path.join(project.inPath, filePath),
            //             outPath: path.join(project.outPath, filePath)
            //         };
            //         pages.push(page);
            //     }
        }
    }

    log(...args: Array<any>) {
        log.debug(...args)
    }

    // Paths

    path(urlPath: string): string {
        return path.join(this.basePath, urlPath)
    }

    // All URL paths matching pattern
    paths(pattern: SeaSitePattern, exclude: ?SeaSitePattern): Array<string> {
        let urlPaths = filterByPatterns(
            walkSync(this.basePath),
            pattern,
            exclude)
        urlPaths.sort()
        return urlPaths
    }

    exists(urlPath: string) {
        try {
            let p = this.path(urlPath)
            return !!fs.statSync(p)
        }
        catch (err) {

        }
        return false
    }

    // URLs

    url(path: string): string {
        if (path[0] !== '/') {
            path = '/' + path
        }
        return path
    }

    publicURL(path: string): string {
        if (this.opt.publicURL) {
            return this.opt.publicURL(this.url(path))
        }
        return this.opt.baseURL + this.url(path)
    }

    // absoluteURL(path: string): string {
    //     return this.opt.baseURL + this.url(path)
    // }

    // File Actions

    move(fromPath: string, toPath: string) {
        this.log(`move ... ${fromPath} -> ${toPath}`)
        fs.renameSync(
            this.path(fromPath),
            this.path(toPath))
    }

    copy(fromPath: string, toPath: string) {
        this.log(`copy ... ${fromPath} -> ${toPath}`)
        fs.copyFileSync(
            this.path(fromPath),
            this.path(toPath))
    }

    copyNPM(moduleName: string, fromRelativePath: string = '', toPath: string = 'npm') {
        this.log(`copy npm module ${moduleName}/${fromRelativePath} -> ${toPath}`)
        let p = require.resolve(moduleName, {
            paths: [this.basePath],
        })
        let rx = /^.*\/node_modules\/[^\/]+/gi
        let m = rx.exec(p)
        if (m) {
            p = m[0]
            p = path.join(p, fromRelativePath)
            let d = this.path(toPath)
            mkdir(d)
            fsx.copySync(
                p,
                d)
        }
    }

    remove(pattern: SeaSitePattern) {
        for (let p of this.paths(pattern)) {
            this.log(`remove ... ${p}`)
            fs.unlinkSync(this.path(p))
        }
    }

    // Read / Write

    read(urlPath: string): ?Buffer {
        try {
            if (urlPath[0] === '/') {
                urlPath = urlPath.substring(1)
            }
            let inPath = path.join(this.basePath, urlPath)
            return fs.readFileSync(inPath)
        } catch (ex) {
            console.error('Failed to .read file:', urlPath)
        }
        return null
    }

    write(urlPath: string, content: string | Buffer | Function) {
        if (urlPath[0] === '/') {
            urlPath = urlPath.substring(1)
        }
        let outPath = path.join(this.basePath, urlPath)
        mkdir(path.dirname(outPath))
        this.log(`write ... ${outPath}`)

        if (typeof content !== 'string') {
            if (isDOM(content)) {
                content = content.html()
            } else {
                content = content.toString()
            }
        }
        fs.writeFileSync(outPath, content, {
            mode: 0o644,
        })
    }

    // DEPRECATED:2018-02-23
    writeDOM($: Function, urlPath: string, mode: ?string = null) {
        let content
        if (mode === 'xml') {
            content = prependXMLIdentifier($.xml())
            // HACK:dholtwick:2016-08-23 Workaround cheerio bug
            content = content.replace(/<!--\[CDATA\[>([\s\S]*?)]]-->/g, '<![CDATA[$1]]>')
        } else {
            // absoluteLinks($, '/' + urlPath)
            content = $.html()
        }

        // Strip comments
        // TODO:2018-02-23 migrate!
        content = content.replace(/<!--(.*?)-->/g, '')

        // this.log($.html());
        this.write(urlPath, content)
    }

    handle(pattern: SeaSitePattern | Object, handler: (any, string) => ?any) {
        let urlPaths = this.paths(pattern)
        if (!urlPaths || urlPaths.length <= 0) {
            log.warn('Did not match any file for', pattern)
        }
        for (let urlPath of urlPaths) {
            this.log(`handle ... ${urlPath}`)
            let content = this.read(urlPath) || ''

            let result = {
                path: urlPath,
                mode: null,
                content: null,
                ignore: false,
            }

            let ret = null
            if (/\.(html?|xml)$/i.test(urlPath)) {
                let xmlMode = /\.xml$/i.test(urlPath)
                let $ = dom(content, {xmlMode})
                result.mode = xmlMode ? 'xml' : 'html'
                result.content = $
                ret = handler($, urlPath)
            } else {
                result.content = content
                ret = handler(content, urlPath)
            }

            if (ret !== false) {
                if (typeof ret === 'string') {
                    ret = {content: ret}
                }
                ret = ret || result || {}
                if (ret.ignore !== true) {
                    let p = ret.path || urlPath
                    let content = ret.content || result.content
                    if (isDOM(content)) {
                        let mode = ret.mode || result.mode
                        if (mode === 'html') {
                            this.writeDOM(content, p, mode)
                        }
                    } else if(content) {
                        this.write(p, content)
                    } else {
                        log.error('Unknow content type for', p, '=>', content)
                    }
                }
            }
        }
    }
}

process.on('unhandledRejection', function (reason, p) {
    console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})

process.on('handledRejection', function (reason, p) {
    console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
