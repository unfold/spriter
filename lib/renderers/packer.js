exports = module.exports = Packer;

// Adapted from https://github.com/jakesgordon/bin-packing

function Packer() {
}

Packer.prototype.pack = function(images) {
    var nodes = images.slice(0).sort(function(a, b) {
        return Math.max(b.width, b.height) - Math.max(a.width, a.height);
    });

    this.root = {x: 0, y: 0, width: nodes[0].width, height: nodes[0].height};

    nodes.forEach(function(node) {
        var space = this.find(this.root, node.width, node.height);
        var fit = space ? this.split(space, node.width, node.height) : this.grow(node.width, node.height);

        node.x = fit.x;
        node.y = fit.y;
    }, this);

    return this.root;
},

Packer.prototype.find = function(node, width, height) {
    if (node.used) {
        return this.find(node.right, width, height) || this.find(node.down, width, height);
    } else if (node.width >= width && node.height >= height) {
        return node;
    }
};

Packer.prototype.split = function(node, width, height) {
    node.used = true;
    node.down = {x: node.x, y: node.y + height, width: node.width, height: node.height - height};
    node.right = {x: node.x + width, y: node.y, width: node.width - width, height: height};

    return node;
};

Packer.prototype.grow = function(width, height) {
    var canGrowDown = this.root.width >= width;
    var canGrowRight = this.root.height >= height;

    var shouldGrowRight = canGrowRight && this.root.height >= this.root.width + width;
    var shouldGrowDown = canGrowDown && this.root.width >= this.root.height + height;

    var growRight = shouldGrowRight || (!shouldGrowDown && canGrowRight);
    var growDown = !shouldGrowRight && (shouldGrowDown || (!canGrowRight && canGrowDown));

    this.root = {
        used: true,
        x: 0,
        y: 0,
        width: this.root.width + (growRight ? width : 0),
        height: this.root.height + (growDown ? height : 0),
        down: growDown ? {x: 0, y: this.root.height, width: this.root.width, height: height} : this.root,
        right: growRight ? {x: this.root.width, y: 0, width: width, height: this.root.height} : this.root
    };

    var space = this.find(this.root, width, height);
    return space && this.split(space, width, height);
};
