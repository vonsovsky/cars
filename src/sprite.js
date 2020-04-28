import { get } from './resources';

function Sprite(url, pos, size, sizeMult, speed, frames, dir, once) {
    this.pos = pos;
    this.size = size;
    this.sizeMultiplicator = sizeMult;
    this.width = size[0] * sizeMult;
    this.height = size[1] * sizeMult;
    this.speed = typeof speed === 'number' ? speed : 0;
    this.frames = frames;
    this._index = 0;
    this.url = url;
    this.dir = dir || 'horizontal';
    this.once = once;
    this.done = false;
};

Sprite.prototype = {
    update: function(dt) {
        this._index += this.speed * dt;
    },
    
    reset: function() {
        this._index = 0;
        this.done = false;
    },

    render: function(ctx) {
        var frame;

        if(this.speed > 0) {
            var max = this.frames.length;
            var idx = Math.floor(this._index);
            frame = this.frames[idx % max];

            if(this.once && idx >= max) {
                this.done = true;
                return;
            }
        } else {
            frame = 0;
        }


        var x = this.pos[0];
        var y = this.pos[1];

        if(this.dir === 'vertical') {
            y += frame * this.size[1];
        }
        else {
            x += frame * this.size[0];
        }

        ctx.drawImage(get(this.url),
                      x, y,
                      this.size[0], this.size[1],
                      0, 0,
                      this.size[0] * this.sizeMultiplicator,
                      this.size[1] * this.sizeMultiplicator);
    }
};

export default Sprite;