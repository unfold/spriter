var fs = require('fs'),
    path = require('path'),
    mime = require('mime');

var retinaQuery = '(-webkit-min-device-pixel-ratio: 1.5)';
var urlPattern = /url\(['"]?((?:[^'"@)]+)(@[^\.]+)?[^'"]*)['"]?\)/;

var isRetinaRule = function(rule) {
    return rule.media && ~rule.media.indexOf(retinaQuery);
};

function createInlineSprites(backgrounds, sourcePath) {
    var spriteMap = {};

    return backgrounds.reduce(function(sprites, background) {
        var url = background.url;
        var sprite = spriteMap[url];

        if (!sprite) {
            var backgroundPath = path.join(sourcePath, url);
            var type = mime.lookup(backgroundPath);
            var data = fs.readFileSync(backgroundPath).toString('base64');

            sprite = spriteMap[url] = {
                data: 'data:' + type + ';base64,' + data,
                backgrounds: []
            };

            sprites.push(sprite);
        }

        sprite.backgrounds.push(background);

        return sprites;
    }, []);
}

function createRules(sprites) {
    return sprites.reduce(function(rules, sprite) {
        sprite.backgrounds.forEach(function(background) {
            var rule = background.rule;
            var pixelRatio = isRetinaRule(background) ? 2 : 1;
            var declarations = rule.declarations.reduce(function(declarations, declaration) {
                declarations.push(declaration);

                if (declaration == background.declaration) {
                    declaration.value = declaration.value.replace(urlPattern, 'url(' + sprite.data + ')');
                }

                return declarations;
            }, []);

            rule.declarations = declarations;

            rules.push(rule);
        });

        return rules;
    }, []);
}

module.exports = function(backgrounds, sourcePath) {
    var sprites = createInlineSprites(backgrounds, sourcePath);
    var rules = createRules(sprites);

    return rules;
};
