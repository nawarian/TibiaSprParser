'use strict';

window.Tibia = {
    Spr: {
        // arg: DataView|File|ArrayBuffer
        Parser: function(arg) {
            if (arg instanceof DataView)
                this._assignDataView(arg);
            if (arg instanceof File)
                this._assignDataViewFromFile(arg);
            if (arg instanceof ArrayBuffer)
                this._assignDataViewFromArrayBuffer(arg);
        }
    }
};

Tibia.Spr.Parser.prototype = {
    _buffer: null,
    _version: null,
    _spritesNum: null,
    _addresses: [],
    _readyToWork: false,

    _assignDataView: function(dataView) {
        if (!dataView instanceof DataView)
            throw "DataView argument must be a valid DataView object";
        this._buffer = dataView;
        this._readyToWork = true;
    },
    _assignDataViewFromArrayBuffer: function(buffer) {
        if (!buffer instanceof ArrayBuffer)
            throw "ArrayBuffer argumento must by a valid ArrayBuffer object";

        this._assignDataView(new DataView(buffer));
    },
    _assignDataViewFromFile: function(file) {
        if (!file instanceof File)
            throw "File argument must be a valid File object";

        var reader = new FileReader(),
            _this = this;

        reader.onload = function() {
            var tmpBuffer = reader.result;
            _this._assignDataViewFromArrayBuffer(tmpBuffer);
        };
        reader.readAsArrayBuffer(file);
    },
    _assertIsReadyToWork: function() {
        if (!this._readyToWork)
            throw "Spr.Parser not ready to work yet";
    },
    getVersion: function() {
        this._assertIsReadyToWork();

        if (!this._version) {
            var b = this._buffer;
            this._version = b.getUint32(0, 4);
        }

        return this._version;
    },
    getNumberOfSprites: function() {
        this._assertIsReadyToWork();
        
        if (!this._spritesNum) {
            var b = this._buffer;

            this._spritesNum = b.getUint16(4, 2);
        }

        return this._spritesNum;
    },
    getSpritesAddresses: function() {
        this._assertIsReadyToWork();
        
        if (this._addresses.length == 0) {
            for (var i = 0; i < this.getNumberOfSprites(); i++) {
                this._addresses.push(
                    this._buffer.getUint32(
                        6 + (4 * i),
                        4
                    )
                );
            }
        }

        return this._addresses;
    },
    getSpriteTransparentColors: function(address) {
        this._assertIsReadyToWork();
        
        var b = this._buffer;
        return {
            red: b.getUint8(address, 1),
            green: b.getUint8(address + 1, 1),
            blue: b.getUint8(address + 2, 1)
        };
    },

    /**
     * returns a array containing colored pixel,
     * each position as a object:
     * {
     *   x: integer,
     *   y: integer,
     *   color: {
     *      red: integer,
     *      green: integer,
     *      blue: integer,
     *      alpha: integer(by default the value is 255)
     *   }
     * }
     */
    getSpriteInfo: function(address) {
        this._assertIsReadyToWork();
        var b = this._buffer,
            spriteInfo = [];

        // First 3 bytes of this address might be
        // the RGB for transparency. Ignore them.
        var startingAddress = (address + 3),
            lastPixel = startingAddress + b.getUint16(startingAddress, 2),
            size = 32,
            current = 0,
            currentAddress = (startingAddress + 2);

        while (currentAddress < lastPixel) {
            var transparentPixelsNum = b.getUint16(currentAddress, 2);
            currentAddress += 2;
            var coloredPixelsNum = b.getUint16(currentAddress, 2);
            currentAddress += 2;

            current += transparentPixelsNum;
            for (var i = 0; i < coloredPixelsNum; i++) {
                var pixel = {
                    x: parseInt(current % size),
                    y: parseInt(current / size),
                    color: {
                        red: b.getUint8(currentAddress++, 1),
                        green: b.getUint8(currentAddress++, 1),
                        blue: b.getUint8(currentAddress++, 1),
                        alpha: 255
                    }
                };

                current++;
                spriteInfo.push(pixel);
            }
        }

        return spriteInfo;
    }
};