[![build status](https://secure.travis-ci.org/unfold/spriter.png)](http://travis-ci.org/unfold/spriter)

# spriter

  CSS sprite sheet generator that analyzes your existing stylesheet and generates optimized sprite sheets along with an updated stylesheet

## Installation

    $ npm install spriter

## spriter(1)

```

Usage: spriter [options] [< in [> out]] [file]

Options:

  -t, --target <path>      target path relative to input
  -s, --source <path>      source path relative to input (required when stdin is used)
  -f, --filter <path>      source url filter (e.g: images/sprites)
  -O, --no-optimization    disable rule optimization
  -h, --help               output usage information
  -V, --version            output the version number

```

for example:

```
$ spriter -t images/sprites/main.png css/main.css > css/main.sprited.css
```

or via `stdin`

```
$ cat css/main.css | spriter -t images/generated/sprites/main.png -s images/sprites -f images/sprites > css/main.sprited.css
```

## Rule optimization

Spriter will by default combine multi-declaration background declarations within the same rule:

```css
.circle {
  background: url(images/generated/sprites.png) no-repeat;
  background-position: -50px 0;
  background-color: #ccc;
  background-size: 100px auto
}
```

becomes:

```css
.circle {
  background: #ccc url(images/generated/sprites.png) -50px 0 100px auto no-repeat
}
```

Optimization can be disabled by supplying the `-O/--no-optimization` flag.

## License

(The MIT License)

Copyright (c) 2012 Simen Brekken &lt;simen@unfold.no&gt; and Daniel Mahal &lt;daniel@unfold.no&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
