// http://codeincomplete.com/posts/2011/5/7/bin_packing/

var util = require('util');

function Block(width, height, x, y) {
    this.width = width;
    this.height = height;
    this.x = x || 0;
    this.y = y || 0;
}

Block.prototype.toString = function() {
    return this.width + 'x' + this.height + (this.x && this.y ? ' @ ' + this.x + 'x' + this.y : '');
};

Block.prototype.clone = function() {
    var block = new Block(this.width, this.height, this.x, this.y);
    block.used = this.used;
    block.right = this.right;
    block.down = this.down;

    return block;
};

/*
Block.prototype.find = function(width, height) {
    if (this.used) {
        return this.right && this.right.find(width, height) || this.down && this.down.find(width, height);
    } else if (this.width >= width && this.height >= height) {
        console.log('Found space in', this.name, this.toString());
        return this;
    }
};
*/

Block.prototype.find = function(root, width, height) {
    if (root.used) {
        return root.find(root.right, width, height) || root.find(root.down, width, height);
        //return this.right && this.right.find(width, height) || this.down && this.down.find(width, height);
    } else if (root.width >= width && root.height >= height) {
        //console.log('Found space in', this.name, this.toString());
        return root;
    }
};

Block.prototype.split = function(block, width, height) {
    // Debug
    //var right = new Block(this.width - width, this.height, this.x + width, this.y);
    //var down = new Block(this.width, this.height - height, this.x, this.y + height);

    //console.log('Splitting', this.toString(), 'to', 'right', right.toString(), 'down', down.toString());

    block.used = true;
    block.right = new Block(block.width - width, block.height, block.x + width, block.y);
    block.down = new Block(block.width, block.height - height, block.x, block.y + height);

    //console.log('Split', this.toString(), 'to', 'right', this.right.toString(), 'down', this.down.toString());

    //console.log('split', block, 'down', block.down, 'right', block.right);

    return block;
};

Block.prototype.grow = function(width, height) {
    var canGrowRight = this.height >= height;
    var canGrowDown = this.width >= width;

    var shouldGrowRight = canGrowRight && this.height >= this.width + width; // attempt to keep square-ish by growing right when height is much greater than width
    var shouldGrowDown  = canGrowDown && this.width >= this.height + height; // attempt to keep square-ish by growing down when width is much greater than height

    if (shouldGrowRight) return this.growRight(width, height);
    else if (shouldGrowDown) return this.growDown(width, height);
    else if (canGrowRight) return this.growRight(width, height);
    else if (canGrowDown) return this.growDown(width, height);

    /*
    var growRight = shouldGrowRight || (!shouldGrowDown && canGrowRight);
    var growDown = !shouldGrowRight && (shouldGrowDown || (!canGrowRight && canGrowDown));

    if (growRight || growDown) {
        console.log('Growing', this.name, growRight ? 'width' : 'height', 'by', growRight ? width : height);
    }

    if (growRight) {
        this.right = new Block(width, this.height, this.width, 0);
        this.down = this.clone();
        this.width += width;
    } else if (growDown) {
        this.right = this.clone();
        this.down = new Block(this.width, height, 0, this.height);
        this.height += height;
    }

    this.used = true;

    if (growRight || growDown) {
        var block = this.find(width, height);

        return block && block.split(width, height);
    }
    */

    return this;
};

Block.prototype.growRight = function(width, height) {
    //console.log('Growing right');

    var right = new Block(width, this.height, this.width, 0);
    var down = this.clone();

    this.right = right;
    this.down = down;
    this.width += width;

    var block = this.find(this, width, height);

    return block && block.split(block, width, height);
};

Block.prototype.growDown = function(width, height) {
    //console.log('Growing down');

    var right = this.clone();
    var down = new Block(this.width, height, 0, this.height);

    this.right = right;
    this.down = down;
    this.height += height;

    var block = this.find(this, width, height);

    return block && block.split(block, width, height);
};

var fs = require('fs');
var child_process = require('child_process');
var Canvas = require('canvas');

function generateColor(){
    var r = (Math.round(Math.random()* 127) + 127).toString(16);
    var g = (Math.round(Math.random()* 127) + 127).toString(16);
    var b = (Math.round(Math.random()* 127) + 127).toString(16);
    return '#' + r + g + b;
}

var pack = exports.pack = function(images) {
    var blocks = images.slice(0).sort(function(a, b) {
        return Math.max(b.width, b.height) - Math.max(a.width, a.height);
    });

    var root = new Block(blocks[0].width, blocks[0].height);
    root.name = 'root';

    //console.log('Packing %d blocks\n', blocks.length);

    blocks.forEach(function(block, index) {
        block.index = index;
        //console.log(index + '.');
        //console.log('Attempting to fit', block.width + 'x' + block.height, 'into', root.toString());

        var space = root.find(root, block.width, block.height);
        var fit = space ? space.split(space, block.width, block.height) : root.grow(block.width, block.height);
        block.x = fit.x;
        block.y = fit.y;

        console.log('%d. %s %dx%d', block.index, space ? 'split' : 'grow', block.x, block.y);

        //console.log('Placed', block.name, block.width + 'x' + block.height, 'at', block.x + 'x' + block.y, 'in', root.toString());
        //console.log('Placed', block.name, block.width + 'x' + block.height, '@', block.x + 'x' + block.y);
        //console.log('');
    });

    var scale = 5;
    var canvas = new Canvas(root.width * scale, root.height * scale);
    var context = canvas.getContext('2d');
    context.font = '10px Arial';
    context.textAlign = 'center';

    blocks.some(function(block, index) {
        var x = block.x * scale;
        var y = block.y * scale;
        var width = block.width * scale;
        var height = block.height * scale;

        context.fillStyle = generateColor();
        context.fillRect(x, y, width, height);
        context.fillStyle = 'black';
        context.fillText(index + '. ' + block.name, x + (width / 2), y + (height / 2));

        if (index > 9) return true;
    });

    var writer = fs.createWriteStream('/tmp/sprite.png');
    var encoder = canvas.createPNGStream();

    encoder.pipe(writer);

    return root;
};

function GrowingPacker() {

}

GrowingPacker.prototype = {

  fit: function(blocks) {
    var n, node, block, len = blocks.length;
    var w = len > 0 ? blocks[0].w : 0;
    var h = len > 0 ? blocks[0].h : 0;
    //this.root = { x: 0, y: 0, w: w, h: h };
    this.root = new Block(w, h);

    for (n = 0; n < len ; n++) {
      block = blocks[n];
      block.index = n;

      if ((node = this.findNode(this.root, block.w, block.h)))
        block.fit = this.splitNode(node, block.w, block.h);
      else
        block.fit = this.growNode(block.w, block.h);

      console.log('%d. %s %dx%d', block.index, node ? 'split' : 'grow', block.fit.x, block.fit.y);
    }
  },

  findNode: function(root, w, h) {
    if (root.used)
      return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
    else if ((w <= root.w) && (h <= root.h))
      return root;
    else
      return null;
  },

  splitNode: function(node, w, h) {
    node.used = true;
    node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
    node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };

    //console.log('split', node, 'down', node.down, 'right', node.right);

    return node;
  },

  growNode: function(w, h) {
    var canGrowDown  = (w <= this.root.w);
    var canGrowRight = (h <= this.root.h);

    var shouldGrowRight = canGrowRight && (this.root.h >= (this.root.w + w)); // attempt to keep square-ish by growing right when height is much greater than width
    var shouldGrowDown  = canGrowDown  && (this.root.w >= (this.root.h + h)); // attempt to keep square-ish by growing down  when width  is much greater than height

    if (shouldGrowRight)
      return this.growRight(w, h);
    else if (shouldGrowDown)
      return this.growDown(w, h);
    else if (canGrowRight)
     return this.growRight(w, h);
    else if (canGrowDown)
      return this.growDown(w, h);
    else
      return null; // need to ensure sensible root starting size to avoid this happening
  },

  growRight: function(w, h) {
    //console.log('Growing right');
    this.root = {
      used: true,
      x: 0,
      y: 0,
      w: this.root.w + w,
      h: this.root.h,
      down: this.root,
      right: { x: this.root.w, y: 0, w: w, h: this.root.h }
    };
    if ((node = this.findNode(this.root, w, h)))
      return this.splitNode(node, w, h);
    else
      return null;
  },

  growDown: function(w, h) {
    //console.log('Growing down');
    this.root = {
      used: true,
      x: 0,
      y: 0,
      w: this.root.w,
      h: this.root.h + h,
      down:  { x: 0, y: this.root.h, w: this.root.w, h: h },
      right: this.root
    };
    if ((node = this.findNode(this.root, w, h)))
      return this.splitNode(node, w, h);
    else
      return null;
  }

};

var images = [
    {width: 17, height: 31, name: 'arrow-left-big'},
    {width: 7, height: 11, name: 'arrow-left-small'},
    {width: 17, height: 31, name: 'arrow-right-big'},
    {width: 7, height: 11, name: 'arrow-right-small'},
    {width: 13, height: 21, name: 'arrow-right'},
    {width: 21, height: 13, name: 'arrow-up'},
    {width: 24, height: 24, name: 'black-border-small'},
    {width: 46, height: 46, name: 'black-border-medium'},
    {width: 138, height: 138, name: 'black-border-large'},
    {width: 40, height: 40, name: 'black-border-outline'},
    {width: 11, height: 11, name: 'close-cross'},
    {width: 48, height: 48, name: 'light-blue-border'},
    {width: 68, height: 68, name: 'light-grey-border-outline'},
    {width: 22, height: 22, name: 'magnifying-glass'},
];

var mine = process.argv.length < 3;

//if (mine) {
    console.log('---------------');
    console.log('Packer:');

    var sheet = pack(images);
//} else {
    console.log('---------------');
    console.log('Growing packer:');

    var blocks = images.map(function(image) {
        return {
            w: image.width,
            h: image.height,
            name: image.name
        };
    });

    var packer = new GrowingPacker();
    packer.fit(blocks.sort(function(a, b) {
        return Math.max(b.w, b.h) - Math.max(a.w, a.h);
    }));

    var scale = 5;
    var canvas = new Canvas(packer.root.w * scale, packer.root.h * scale);
    var context = canvas.getContext('2d');
    context.font = '10px Arial';
    context.textAlign = 'center';

    blocks.some(function(block, index) {
        var x = block.fit.x * scale;
        var y = block.fit.y * scale;
        var w = block.w * scale;
        var h = block.h * scale;

        context.fillStyle = generateColor();
        context.fillRect(x, y, w, h);
        context.fillStyle = 'black';
        context.fillText(index + '. ' + block.name, x + (w / 2), y + (h / 2));

        if (index > 9) return true;
    });

    var writer = fs.createWriteStream('/tmp/sprite-growing.png');
    var encoder = canvas.createPNGStream();

    encoder.pipe(writer);
//}


//console.log(packer.root);

//images.forEa

//var sheet = pack(images);


//var packer = new Packer(block)
