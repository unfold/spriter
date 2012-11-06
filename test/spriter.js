var spriter = require('..'),
    fs = require('fs');

function fixture(name) {
    return fs.readFileSync('test/fixtures/' + name + '.css', 'utf8');
}

describe('spriter', function() {
    var targetPath = 'images/generated/sprites';
    var sourcePath = 'images/sprites';

    it('should generate sprite sheet', function() {
        spriter('test/fixtures/simple.css', sourcePath, targetPath).should.equal(fixture('simple.out'));
    });

    it('should read declarations within media queries', function() {
        spriter('test/fixtures/media-query.css', sourcePath, targetPath).should.equal(fixture('media-query.out'));
    });

    it('should not read filtered declarations', function() {
        spriter('test/fixtures/filtered.css', sourcePath, targetPath).should.equal(fixture('filtered.out'));
    });

    it('should group sprites by suffix', function() {
        spriter('test/fixtures/suffix.css', sourcePath, targetPath).should.equal(fixture('suffix.out'));
    });
});
