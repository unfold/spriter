var css = require('css')

exports = module.exports = spriter;

var urlPattern = /url\(['"]?((?:[^'"@)]+)(@[^\.]+)?[^'"]*)['"]?\)/;
var positionPattern = /\s*(?:no\-repeat|(\d+)(?:px)?\s+(\d+)(?:px)?)/g;

var findBackgrounds = function(rules, filter) {
    var visit = function(rules, backgrounds, media) {
        rules.forEach(function(rule) {
            if (rule.media) return visit(rule.rules, backgrounds, rule.media);

            rule.declarations && rule.declarations.forEach(function(declaration) {
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

var optimizeRules = function(rules) {
    return rules.reduce(function(rules, rule) {
        var properties = {};

        var declarations = rule.declarations.filter(function(declaration) {
            var property = declaration.property;

            if (property.indexOf('background') === 0) {
                properties[property.replace('background-', '')] = declaration.value;

                return false;
            }

            return true;
        });

        if (properties.background || (properties.image && properties.position)) {
            // Assemble in correct order:
            // <image> || <position>[/<size>] || <repeat> || <attachment> || <origin & clip>
            var values = [
                properties.color,
                properties.background ? properties.background.replace(positionPattern, '') : properties.image,
                properties.position && properties.position + (properties.size ? '/' + properties.size : ''),
                'no-repeat',
                properties.attachment,
                properties.origin,
                properties.clip
            ].filter(function(value) {
                return value && value != '0 0';
            });

            var declaration = {
                type: 'declaration',
                property: 'background',
                value: values.join(' ')
            };

            rule.declarations = declarations.concat(declaration);

            rules.push(rule);
        }

        return rules;
    }, []);
};

function spriter(str, sourcePath, targetPath, filter, optimize, inline) {
    var ast = css.parse(str);
    var backgrounds = findBackgrounds(ast.stylesheet.rules, filter);
    var render = require('./renderers/' + (inline ? 'data-uri' : 'sheet'));
    var rules = render(backgrounds, sourcePath, targetPath);

    if (optimize) optimizeRules(rules);

    return css.stringify(ast);
}
