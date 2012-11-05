# spriter

  CSS sprite sheet generator

## Installation

    $ npm install spriter

## spriter(1)

```

Usage: spriter [options] <file>

Options:

  -h, --help            output usage information
  -V, --version         output the version number
  -s, --source <path>   source path filter relative to input file
  -t, --target <path>   target path relative to input file

```

for example:

```
$ spriter -s images/sprites -t images/generated/sprites css/main.css > css/main.sprited.css
```

## License

(The MIT License)

Copyright (c) 2011 Simen Brekken &lt;simen@unfold.no&gt;

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
