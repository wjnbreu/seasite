"use strict";

var _markdown = require("./markdown");

describe('Markdown', function () {
  it('parses correctly', function () {
    var r = (0, _markdown.markdown)('Hello **world**');
    expect(r).toEqual({
      'content': 'Hello **world**',
      'html': '<p>Hello <strong>world</strong></p>\n',
      'props': {}
    });
  });
  it('parses properties', function () {
    var r = (0, _markdown.markdown)("---\ntitle: One World\n---\n\n# This is a world\n\n```js\nalert(1)\nalert(2)\n```        \n\nLorem **ipsum**\n");
    expect(r.props).toEqual({
      title: 'One World'
    });
    expect(r.html).toBe('<h1>This is a world</h1><pre><code class="lang-js">alert(1)\nalert(2)</code></pre>\n<p>Lorem <strong>ipsum</strong></p>\n');
  });
});