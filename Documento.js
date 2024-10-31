"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Documento = void 0;
var Documento = /** @class */ (function () {
    function Documento(_tipoDocumento) {
        this._tipoDocumento = _tipoDocumento;
        this.TipoDocumento = _tipoDocumento;
    }
    Object.defineProperty(Documento.prototype, "TipoDocumento", {
        get: function () {
            return this._tipoDocumento;
        },
        set: function (value) {
            if (value.length < 11)
                throw new Error('Teste');
            this._tipoDocumento = value;
        },
        enumerable: false,
        configurable: true
    });
    return Documento;
}());
exports.Documento = Documento;
var n1 = new Documento('ddddddddd');
console.log(n1);
