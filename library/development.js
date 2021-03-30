// |~> SketchableJS Library.
// |~> Version 1.0.0 (MIT License).
// |~> © Muhammad A. Abu Baker.
// |~> https://github.com/mhmdkrmabd/sketchablejs
class Sketchable {
  constructor(Canvas, Options = "d") {
    this.canvas = Canvas;
    this.ctx = Canvas.getContext('2d');
    this.defaults = [Canvas.width, Canvas.height, 2, "#000", "round", "#fff"];
    let main = this;
    if (Options == "d") {
      this.width = this.defaults[0];
      this.height = this.defaults[1];
      this.pen = {
        size: this.defaults[2],
        color: this.defaults[3],
        type: this.defaults[4],
      };
      this.backgroundColor = this.defaults[5];
    } else {
      let opt = ["width", "height", "penSize", "penColor", "penType", "backgroundColor"];
      let givenOpt = new Array(opt.length);
      var i = 0;
      while (i < opt.length) {
        let cond = " > 0";
        if (i >= 3) {
          cond = ".length != 0";
        }
        if (eval("Options." + opt[i] + " != undefined && Options." + opt[i] + cond)) {
          eval("givenOpt[" + i + "]" + " = Options." + opt[i]);
        } else {
          givenOpt[i] = main.defaults[i];
        }
        ++i;
      }
      this.width = givenOpt[0];
      this.height = givenOpt[1];
      this.pen = {
        size: givenOpt[2],
        color: givenOpt[3],
        type: givenOpt[4]
      };
      this.backgroundColor = givenOpt[5];
    }
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this._redrawing = false;
    this._stopRedrawAnimation = false;
    this._sketching = false;
    this._savedDraws = [];
    this._deletedDraws = [];
    this._changes = true;
    this._drawAttr = {
      size: this.defaults[2],
      color: this.defaults[3],
      type: this.defaults[4],
    }
    this.canvas.addEventListener('mousedown', function(e) {
      main._startingPos(e);
    });
    this.canvas.addEventListener('mouseup', function() {
      main._finishingPos();
    });
    this.canvas.addEventListener('mousemove', function(e) {
      main._sketch(e);
    });
  }
  _startingPos(e) {
    if (!this._redrawing) {
      this._sketching = true;
      this._sketch(e);
    }
  }
  _finishingPos() {
    if (!this._redrawing) {
      this._sketching = false;
      this._savedDraws.push("PR");
      this.ctx.beginPath();
    }
  }
  _sketch(e) {
    if (!this._redrawing) {
      if (!this._sketching) {
        this.ctx.beginPath();
        return;
      }
      this._draw(this.pen.size, this.pen.color, this.pen.type, e.offsetX, e.offsetY);
    }
  }
  _draw(size, clr, type, x, y, save = true) {
    this.ctx.lineWidth = size;
    this.ctx.strokeStyle = clr;
    this.ctx.lineCap = type;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    if (save) {
      if (this._changes) {
        let changes = "CH:" + size + "," + clr + "," + type;
        this._savedDraws.push(changes);
        this._changes = false;
      }
      let info = {
        x: x,
        y: y
      };
      this._savedDraws.push(info);
    }
  }
  redraw(Animation = false, Speed = 15, CallbackFunction = "none") {
    if (!this._redrawing) {
      this.clear(false);
      let main = this;
      if (!Animation) {
        var i = 0;
        while (i < this._savedDraws.length) {
          let _draw = this._savedDraws[i];
          if (_draw == "PR") {
            this.ctx.beginPath();
          } else {
            if (_draw.x == undefined && _draw.indexOf('CH:') != -1) {
              _draw = (_draw.replace("CH:", "")).split(",");
              this._drawAttr.size = _draw[0];
              this._drawAttr.color = _draw[1];
              this._drawAttr.type = _draw[2];
            } else {
              main._draw(this._drawAttr.size, this._drawAttr.color, this._drawAttr.type, _draw.x, _draw.y, false);
            }
          }
          ++i;
        }
      } else {
        if (isNaN(Speed) || Speed == null || Speed == undefined || Speed <= 0) {
          Speed = 15;
        }
        this._stopRedrawAnimation = false;
        this._redraw_animation(0, Speed, CallbackFunction);
      }
    }
  }
  _redraw_animation(_drawID, speed, callbackFunction) {
    this._redrawing = true;
    if (this._stopRedrawAnimation) {
      this._stopRedrawAnimation = false;
      this._redrawing = false;
      this.ctx.beginPath();
      this.redraw();
    } else {
      let main = this;
      if (_drawID <= this._savedDraws.length - 1) {
        let _draw = this._savedDraws[_drawID];
        if (_draw == "PR") {
          main.ctx.beginPath();
        } else {
          if (_draw.x == undefined && _draw.indexOf('CH:') != -1) {
            _draw = (_draw.replace("CH:", "")).split(",");
            this._drawAttr.size = _draw[0];
            this._drawAttr.color = _draw[1];
            this._drawAttr.type = _draw[2];
          } else {
            main._draw(this._drawAttr.size, this._drawAttr.color, this._drawAttr.type, _draw.x, _draw.y, false);
          }
        }
        ++_drawID;
        setTimeout(function() {
          main._redraw_animation(_drawID, speed, callbackFunction);
        }, speed);
      } else {
        this._redrawing = false;
        if (callbackFunction != undefined && callbackFunction != "none") {
          callbackFunction();
        }
      }
    }
  }
  stopRedrawAnimation() {
    this._stopRedrawAnimation = true;
  }
  clear(Everything = true) {
    if (!this._redrawing) {
      this.ctx.stroke();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      if (Everything) {
        this._savedDraws = [];
        this._deletedDraws = [];
      }
    }
  }
  undo(Inner = "no") {
    if (!this._redrawing) {
      let main = this;
      if (main._savedDraws.length > 0) {
        if (Inner == "no") {
          main._deletedDraws.push(main._savedDraws[main._savedDraws.length - 1]);
          main._savedDraws.pop();
          main.undo("yes");
        } else {
          let _draw = main._savedDraws[main._savedDraws.length - 1];
          if (_draw == "PR") {
            main.redraw();
          } else {
            main._deletedDraws.push(_draw);
            main._savedDraws.pop();
            main.undo("yes");
          }
        }
      } else {
        main.clear(false);
      }
    }
  }
  redo(Inner = "no") {
    if (!this._redrawing) {
      let main = this;
      if (main._deletedDraws.length > 0) {
        if (Inner == "no") {
          main._savedDraws.push(main._deletedDraws[main._deletedDraws.length - 1]);
          main._deletedDraws.pop();
          main.redo("yes");
        } else {
          let _draw = main._deletedDraws[main._deletedDraws.length - 1];
          main._savedDraws.push(_draw);
          main._deletedDraws.pop();
          if (_draw == "PR") {
            main.redraw();
          } else {
            main.redo("yes");
          }
        }
      }
    }
  }
  returnToDefaults() {
    this.pen = {
      size: this.defaults[2],
      color: this.defaults[3],
      type: this.defaults[4],
    };
    this.backgroundColor = this.defaults[5];
    this.redraw();
  }
  changeBackgroundColor(Color) {
    if (!this._redrawing) {
      this.backgroundColor = Color;
      this.redraw();
    }
  }
  export () {
    if (!this._redrawing) {
      let temp;
      temp = this._savedDraws;
      temp.push(this.backgroundColor);
      return JSON.stringify(temp);
    }
  }
  import(DrawsJSON) {
    if (!this._redrawing) {
      let temp;
      try {
        temp = JSON.parse(DrawsJSON);
      } catch (e) {
        return -1;
      }
      if (temp[temp.length - 1] == undefined || temp[temp.length - 1] == null) {
        return -1;
      }
      let bgColor = temp[temp.length - 1];
      temp = temp.slice(0, temp.length - 1);
      this._savedDraws = temp;
      this._deletedDraws = [];
      this.changeBackgroundColor(bgColor);
    }
  }
  penSize(Size) {
    if (!this._redrawing) {
      if (Size != null && Size != undefined && Size > 0 && !isNaN(Size) && Size > 0) {
        this.pen.size = Size;
        this._changes = true;
      }
    }
  }
  penColor(Color) {
    if (!this._redrawing) {
      if (Color != null && Color != undefined && Color.length > 0) {
        this.pen.color = Color;
        this._changes = true;
      }
    }
  }
  penType(Type) {
    if (!this._redrawing) {
      let types = ["butt", "round", "square"];
      if (Type.length != 0 && types.includes(Type)) {
        this.pen.type = Type;
        this._changes = true;
      }
    }
  }
  listAttriubtes() {
    let attributes = {
      Dimensions: {
        Width: this.width,
        Height: this.height
      },
      Pen: {
        Size: this.pen.size,
        Color: this.pen.color,
        Type: this.pen.type
      },
      Draw: {
        Saved: this._savedDraws.length,
        Deleted: this._deletedDraws.length
      },
      Actions: {
        Sketching: this._sketching,
        Redrawing: this._redrawing
      },
      BackgroundColor: this.backgroundColor
    };
    return attributes;
  }
}
console.log('%cSketchableJS Library v1.0.0', 'background-image: linear-gradient(to right, #30399d, #732785, #911568, #9e1b4a, #9d3030); color: #F5F5F5');
console.log('%cAuthor: Muhammad Abed El Hay Abu Baker', 'background-image: linear-gradient(to left, #30399d, #732785, #911568, #9e1b4a, #9d3030); color: #F5F5F5');
console.log('%cGithub: github.com/mhmdkrmabd/sketchablejs', 'background-image: linear-gradient(to right, #30399d, #732785, #911568, #9e1b4a, #9d3030); color: #F5F5F5');
