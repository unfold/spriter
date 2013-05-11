[![build status](https://secure.travis-ci.org/unfold/spriter.png)](http://travis-ci.org/unfold/spriter)

### CSS Sprites Made Simple.

Spriter analyzes your existing CSS files and either generates highly 
optimized sprite sheets using a [growing binary tree bin-packing algorithm](http://codeincomplete.com/posts/2011/5/7/bin_packing) or inlines them using [data URIs](http://en.wikipedia.org/wiki/Data_URI_scheme#CSS) 
and outputs an updated CSS stylesheet.

It even groups your [retina](http://work.no/lib/images/generated/sprites/base@2x.png) 
and [non-retina](http://work.no/lib/images/generated/sprites/base@2x.png) images 
into separate sprite sheets to reduce load times.

#### No strings attached

Instead of relying on a specific [framework](http://compass-style.org) 
or [build system](http://gruntjs.com) Spriter will work with anything that outputs 
or processes a CSS file.

### Installation

    $ npm install spriter

### Usage

    $ spriter [options] [file]

### Options
    -t, --target <path>      target path relative to input (required unless generating inline)
    -s, --source <path>      source path relative to input (required when stdin is used)
    -f, --filter <path>      source url filter (e.g: images/sprites)
    -i, --inline             inline sprites as data URIs
    -O, --no-optimization    disable rule optimization
    -h, --help               output usage information
    -V, --version            output the version number

### Examples

#### Generating a sprite sheet from an existing CSS file:

    $ spriter --target images/sprites.png main.css > main.sprited.css
    
If Spriter finds any retina resolution images it will generate a separate sprite sheet 
for those images (in this example `ímages/sprites@2x.png`)
    
#### Using Spriter with [SASS](http://sass-lang.com):

    $ sass css/main.scss | spriter --source css --target images/sprites.png > main.css
    
The `--source` option tells Spriter how to translate URLs into file system paths 
when reading images.

In this example the resulting sprite would be generated at `css/images/sprites.png`.

#### Only include images in a specific location:

    $ spriter --target images/home-sprites.png --filter images/home/ main.css > main.sprited.css

This is handy for multi-page sites where you want to group sprite sheets by page or similar.

#### Inline images in CSS using [data URIs](http://en.wikipedia.org/wiki/Data_URI_scheme#CSS)

    $ spriter --filter images/sprites/icons/ --inline main.css > main.sprited.css

### Rule optimization

Spriter will by default convert multi-declaration backgrounds to a single 
short-hand within the same rule:

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

Optimization can be disabled by supplying the `--no-optimization` flag.

### API

    var spriter = require('spriter')
    
    spriter(string, sourcePath, targetPath, optimize, inline)


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
