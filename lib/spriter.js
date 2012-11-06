var css = require('css'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp').sync,
    Canvas = require('canvas'),
    Packer = require('./packer');

exports = module.exports = spriter;

var urlPattern = /url\(['"]?((?:[^'"@)]+)(@\w+)?.*)['"]?\)/;
var retinaPattern = /(@\w+)\./;

var groupByUrl = function(sheets, sprite) {
    (sheets[sprite.url] || (sheets[sprite.url] = [])).push(sprite);

    return sheets;
};

var findBackgrounds = function(rules, filter) {
    var visit = function(backgrounds, rule) {
        if (rule.media) return rule.rules.reduce(visit, backgrounds);

        rule.declarations.forEach(function(declaration) {
            if ((declaration.property == 'background' || declaration.property == 'background-image')) {
                var matches = urlPattern.exec(declaration.value);

                if (matches) {
                    var url = matches[1];

                    if (url.indexOf(filter) === 0) {
                        backgrounds.push({
                            rule: rule,
                            declaration: declaration,
                            url: url
                        });
                    }
                }
            }
        });

        return backgrounds;
    };

    return rules.reduce(visit, []);
};

var groupBackgrounds = function(backgrounds, sheet) {
    return backgrounds.reduce(function(groups, background) {
        var matches = retinaPattern.exec(background.url);
        var name = sheet + (matches ? matches[1] : '');

        (groups[name] || (groups[name] = [])).push(background);

        return groups;
    }, {});
};

var createSpriteSheets = function(groups, basePath, targetPath) {
    mkdirp(path.join(basePath, targetPath));

    return Object.keys(groups).map(function(name) {
        var backgrounds = groups[name];
        var sprites = backgrounds.map(function(background) {
            var image = new Canvas.Image();
            image.src = path.join(basePath, background.url);

            return image.width && {
                background: background,
                image: image
            };
        });

        var images = sprites.map(function(sprite) {
            return sprite.image;
        });

        var packer = new Packer();
        var sheet = packer.pack(images);
        var canvas = new Canvas(sheet.width, sheet.height);
        var context = canvas.getContext('2d');

        images.forEach(function(image) {
            context.drawImage(image, image.x, image.y, image.width, image.height);
        });

        var url = path.join(targetPath, name + '.png');
        var writer = fs.createWriteStream(path.join(basePath, url));
        var encoder = canvas.createPNGStream();

        encoder.pipe(writer);

        return {
            url: url,
            sprites: sprites
        };
    });
};

var updateRules = function(sheets) {
    return sheets.reduce(function(rules, sheet) {
        sheet.sprites.forEach(function(sprite) {
            var rule = sprite.background.rule;
            rule.declarations.some(function(declaration, index, declarations) {
                if (declaration == sprite.background.declaration) {
                    declaration.value = declaration.value.replace(urlPattern, 'url(' + sheet.url + ')');

                    var image = sprite.image;

                    if (image.x || image.y) {
                     var positionDeclaration = {
                            property: 'background-position',
                            value: (image.x ? -image.x + 'px' : 0) + ' ' + (image.y ? -image.y + 'px' : 0)
                        };

                        declarations.splice(index + 1, 0, positionDeclaration);
                    }

                    return true;
                }
            });

            rules.push(rule);
        });

        return rules;
    }, []);
};

function spriter(filename, sourcePath, targetPath) {
    var ast = css.parse(fs.readFileSync(filename, 'utf-8'));
    var backgrounds = findBackgrounds(ast.stylesheet.rules, sourcePath);
    var groups = groupBackgrounds(backgrounds, path.basename(filename, '.css'));
    var sheets = createSpriteSheets(groups, path.dirname(filename), targetPath);
    var rules = updateRules(sheets);

    return css.stringify(ast);
}
