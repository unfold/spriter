var css = require('css'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp').sync,
    Canvas = require('canvas');

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
    // Assemble in syntax order (https://developer.mozilla.org/en-US/docs/CSS/background#Syntax)
    var order = ['color', 'image', 'position', 'size', 'repeat', 'attachment', 'clip'];

    return rules.reduce(function(rules, rule) {
        var properties = {};

        var declarations = rule.declarations.filter(function(declaration) {
            if (declaration.property.indexOf('background') === 0) {
                properties[declaration.property.replace('background-', '')] = declaration.value;

                return false;
            }

            return true;
        });

        if (properties.background || (properties.image && properties.position)) {
            properties.repeat = 'no-repeat';

            var values = Object.keys(properties).sort(function(a, b) {
                return order.indexOf(a) - order.indexOf(b);
            }).filter(function(property) {
                return properties[property] != '0 0';
            }).map(function(property) {
                var value = properties[property];

                return property == 'background' ? value.replace(positionPattern, '') : value;
            });

            var declaration = {
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
