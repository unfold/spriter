var css = require('css'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp').sync,
    Canvas = require('canvas'),
    Packer = require('./packer');

exports = module.exports = spriter;

var urlPattern = /url\(['"]?((?:[^'"@)]+)(@[^\.]+)?[^'"]*)['"]?\)/;
var retinaQuery = '(-webkit-min-device-pixel-ratio: 1.5)';
var retinaPattern = /(@\w+)\./;

var isRetinaRule = function(rule) {
    return rule.media && ~rule.media.indexOf(retinaQuery);
};

var groupByUrl = function(sheets, sprite) {
    (sheets[sprite.url] || (sheets[sprite.url] = [])).push(sprite);

    return sheets;
};

var findBackgrounds = function(rules, filter) {
    var visit = function(rules, backgrounds, media) {
        rules.forEach(function(rule) {
            if (rule.media) return visit(rule.rules, backgrounds, rule.media);

            rule.declarations.forEach(function(declaration) {
                if ((declaration.property == 'background' || declaration.property == 'background-image')) {
                    var matches = urlPattern.exec(declaration.value);

                    if (matches) {
                        var url = matches[1];

                        if (!filter || ~url.indexOf(filter)) {
                            backgrounds.push({
                                rule: rule,
                                declaration: declaration,
                                url: url,
                                media: media
                            });
                        }
                    }
                }
            });
        });

        return backgrounds;
    };

    return visit(rules, []);
};

var groupBackgrounds = function(backgrounds, sheet) {
    return backgrounds.reduce(function(groups, background) {
        var matches = retinaPattern.exec(background.url);
        var name = sheet + (matches ? matches[1] : '');

        (groups[name] || (groups[name] = [])).push(background);

        return groups;
    }, {});
};

var createSpriteSheets = function(groups, sourcePath, targetPath) {
    mkdirp(path.join(sourcePath, targetPath));

    return Object.keys(groups).map(function(name) {
        var backgrounds = groups[name];
        var sprites = backgrounds.map(function(background) {
            var image = new Canvas.Image();
            image.src = path.join(sourcePath, background.url);

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
        var url = path.join(targetPath, name + '.png');

        var canvas = new Canvas(sheet.width, sheet.height);
        var context = canvas.getContext('2d');

        images.forEach(function(image) {
            context.drawImage(image, image.x, image.y, image.width, image.height);
        });

        fs.writeFileSync(path.join(sourcePath, url), canvas.toBuffer());

        return {
            url: url,
            width: sheet.width,
            height: sheet.width,
            sprites: sprites
        };
    });
};

var updateRules = function(sheets) {
    return sheets.reduce(function(rules, sheet) {
        sheet.sprites.forEach(function(sprite) {
            var background = sprite.background;
            var rule = background.rule;
            var pixelRatio = isRetinaRule(background) ? 2 : 1;

            rule.declarations.forEach(function(declaration, index, declarations) {
                if (declaration == background.declaration) {
                    declaration.value = declaration.value.replace(urlPattern, 'url(' + sheet.url + ')');

                    var image = sprite.image;

                    if (image.x || image.y) {
                        var positionDeclaration = {
                            property: 'background-position',
                            value: (image.x ? -Math.round(image.x / pixelRatio) + 'px' : 0) + ' ' + (image.y ? -Math.round(image.y / pixelRatio) + 'px' : 0)
                        };

                        declarations.push(positionDeclaration);
                    }
                } else if (declaration.property == 'background-size') {
                    declaration.value = Math.round(sheet.width / pixelRatio) + 'px auto';
                }
            });

            rules.push(rule);
        });

        return rules;
    }, []);
};

function spriter(str, sourcePath, targetPath, filter) {
    var ast = css.parse(str);

    var backgrounds = findBackgrounds(ast.stylesheet.rules, filter);
    var groups = groupBackgrounds(backgrounds, path.basename(targetPath, '.png'));
    var sheets = createSpriteSheets(groups, sourcePath, path.dirname(targetPath));
    var rules = updateRules(sheets);

    return css.stringify(ast);
}
