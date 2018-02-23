'use strict';

var _jsx = require('./jsx');

var _dom = require('./dom');

var _index = require('../plugins/index');

describe('DOM', function () {

    it('should understand HTML', function () {
        var r = (0, _jsx.jsx)(
            'div',
            null,
            (0, _jsx.jsx)(
                'b',
                null,
                'Bold'
            )
        );
        var $ = (0, _dom.dom)(r);

        $.applyPlugins([(0, _index.example)('test')], {
            value: 123
        });

        expect($.html()).toBe('<html><head><meta name="test" value="123"></head><body><div><b>Bold</b></div></body></html>');
    });
}); /*
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

// (C)opyright Dirk Holtwick, 2017-01-19 <dirk.holtwick@gmail.com>
// @jsx jsx