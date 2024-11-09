import { deleteFile, generateCSV, getDataExtraction, sleep } from "./util.js";

const fixCalculationInformations = ({
  calculo,
  premio_informado,
  parcelas,
  valor_divida,
}) => {
  calculo.precificacao.premio.informado = parseFloat(premio_informado);
  calculo.contratantes.forEach((calculoContratante) => {
    calculoContratante.dadosPagamento.quantidadeParcelas = parseFloat(parcelas);
    calculoContratante.grupos.forEach((calculoContratanteGrupo) => {
      calculoContratanteGrupo.segurados.forEach(
        (calculoContratanteGrupoSegurado) => {
          calculoContratanteGrupoSegurado.coberturas.forEach(
            (calculoContratanteGrupoSeguradoCobertura) => {
              if (
                ["RIT", "DES"].includes(
                  calculoContratanteGrupoSeguradoCobertura.sigla
                )
              ) {
                calculoContratanteGrupoSeguradoCobertura.valor =
                  parseFloat(valor_divida);
              }
            }
          );
        }
      );
    });
  });
  calculo.remuneracoes.forEach((remuneracao) => {
    if (remuneracao.tipoRemuneracao == "REP") remuneracao.percentual = 70;
    if (remuneracao.tipoRemuneracao == "COR") remuneracao.percentual = 1.8;
  });
  return calculo;
};

const init = async () => {
  console.log("Processing...");
  const dataEmail = {};
  const dataFixedCSV = [];

  deleteFile("EP-CENÁRIOS-CORRIGIDOS.csv");

  await sleep(3000);

  await getDataExtraction({
    filePath: "files/email/EP-SETEMBRO.csv",
    fn: (data) => (dataEmail[data.numeropropostaporto] = data),
  });

  await getDataExtraction({
    filePath: "EP-NÚMEROS-ENCONTRADOS.csv",
    fn: (data) => {
      const jsonParsed = JSON.parse(data.json);
      const findDataEmail = dataEmail[jsonParsed.calculo.numero];
      if (!findDataEmail) console.log("Not found data email");
      if (findDataEmail) {
        const { premio_informado, parcelas, valor_divida } = findDataEmail;
        const fixedCalculation = fixCalculationInformations({
          calculo: jsonParsed.calculo,
          premio_informado,
          parcelas,
          valor_divida,
        });
        dataFixedCSV.push({
          empresa: 4,
          produto: data.produto,
          num_orcamento: `18${data.num_orcamento}`,
          json: JSON.stringify({
            naoSalvarDados: true,
            ...jsonParsed,
            calculo: fixedCalculation,
          }),
        });
      }
    },
    separator: ",",
  });

  generateCSV({
    filePath: "EP-CENÁRIOS-CORRIGIDOS",
    data: dataFixedCSV,
  });

  console.log(dataFixedCSV);
};

init();
