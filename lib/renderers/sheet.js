var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp').sync,
    Canvas = require('canvas'),
    Packer = require('./packer');

var retinaPattern = /(@\w+)\./;
var retinaQuery = '(-webkit-min-device-pixel-ratio: 1.5)';
var urlPattern = /url\(['"]?((?:[^'"@)]+)(@[^\.]+)?[^'"]*)['"]?\)/;

var isRetinaRule = function(rule) {
    return rule.media && ~rule.media.indexOf(retinaQuery);
};

function groupBackgrounds(backgrounds, sheet) {
    return backgrounds.reduce(function(groups, background) {
        var matches = retinaPattern.exec(background.url);
        var name = sheet + (matches ? matches[1] : '');

        (groups[name] || (groups[name] = [])).push(background);

        return groups;
    }, {});
}

function createSheets(groups, sourcePath, targetPath) {
    mkdirp(path.join(sourcePath, targetPath));

    var spriteMap = {};

    return Object.keys(groups).map(function(name) {
        var backgrounds = groups[name];
        var sprites = backgrounds.reduce(function(sprites, background) {
            var url = background.url;
            var sprite = spriteMap[url];

            if (!sprite) {
                var image = new Canvas.Image();
                image.src = path.join(sourcePath, url);

                sprite = spriteMap[url] = {
                    width: image.width,
                    height: image.height,
                    image: image,
                    backgrounds: []
                };

                sprites.push(sprite);
            }

            sprite.backgrounds.push(background);

            return sprites;
        }, []);

        var packer = new Packer();
        var sheet = packer.pack(sprites);
        var url = path.join(targetPath, name + '.png');

        var canvas = new Canvas(sheet.width, sheet.height);
        var context = canvas.getContext('2d');

        sprites.forEach(function(sprite) {
            try {
                context.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height);
            } catch (e) {
                console.warn('Error loading image %s: %s', sprite.image.src, e.message)
            }
        });

        fs.writeFileSync(path.join(sourcePath, url), canvas.toBuffer());

        return {
            url: url,
            width: sheet.width,
            height: sheet.height,
            sprites: sprites
        };
    });
}

function createRules(sheets) {
    return sheets.reduce(function(rules, sheet) {
        sheet.sprites.forEach(function(sprite) {
            sprite.backgrounds.forEach(function(background) {
                var rule = background.rule;
                var pixelRatio = isRetinaRule(background) ? 2 : 1;
                var declarations = rule.declarations.reduce(function(declarations, declaration) {
                    declarations.push(declaration);

                    if (declaration == background.declaration) {
                        var position = (sprite.x ? -Math.round(sprite.x / pixelRatio) + 'px' : 0) + ' ' + (sprite.y ? -Math.round(sprite.y / pixelRatio) + 'px' : 0);

                        declaration.value = declaration.value.replace(urlPattern, 'url(' + sheet.url + ')');
                        declarations.push({type: 'declaration', property: 'background-position', value: position});
                    } else if (declaration.property == 'background-size') {
                        declaration.value = Math.round(sheet.width / pixelRatio) + 'px auto';
                    }

                    return declarations;
                }, []);

                rule.declarations = declarations;

                rules.push(rule);
            });
        });

        return rules;
    }, []);
}

module.exports = function(backgrounds, sourcePath, targetPath) {
    var groups = groupBackgrounds(backgrounds, path.basename(targetPath, '.png'));
    var sheets = createSheets(groups, sourcePath, path.dirname(targetPath));
    var rules = createRules(sheets);

    return rules;
};
