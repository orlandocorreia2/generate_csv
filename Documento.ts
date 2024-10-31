export class Documento {
    constructor(private _tipoDocumento: string) {
        this.TipoDocumento = _tipoDocumento
    }

    set TipoDocumento (value) {
        if (value.length < 11) throw new Error('Teste');
        this._tipoDocumento = value
    }

    get TipoDocumento() {
        return this._tipoDocumento
    }
}


const n1 = new Documento('ddddddddd');


console.log(n1);