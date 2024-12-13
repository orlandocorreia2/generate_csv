import { deleteFile, generateCSV, getDataExtraction } from "./util.js";
import body from "./body-ccr-not-found.js";

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
  const result = {};
  const dataCSV = [];
  const dataNumbersNotFound = [];

  deleteFile("CCR-NUMEROS-NAO-ENCONTRADOS-GERADOS.csv");

  await getDataExtraction({
    filePath: "files/email/CCR-AGOSTO.csv",
    fn: (data) => {
      result[data.numeropropostaporto] = data;
    },
  });

  await getDataExtraction({
    filePath: "files/email/CCR-SETEMBRO.csv",
    fn: (data) => {
      result[data.numeropropostaporto] = data;
    },
  });

  await getDataExtraction({
    filePath: "files/email/CCR-CONSOLIDADO.csv",
    fn: (data) => {
      const proposalNumber = data[Object.keys(data)[0]];
      delete result[proposalNumber];
    },
    separator: ";",
  });

  Object.keys(result).forEach((numero, index) => {
    const { parcelas, valor_divida, premio_informado } = result[numero];
    const dataFixed = fixCalculationInformations({
      calculo: body.calculo,
      parcelas,
      valor_divida,
      premio_informado,
    });

    dataCSV.push({
      empresa: 4,
      produto: 151,
      num_orcamento: `18${numero}`,
      json: JSON.stringify({
        naoSalvarDados: true,
        calculo: dataFixed,
      }),
    });

    dataNumbersNotFound.push({
      number: numero,
    });
  });

  generateCSV({
    filePath: "CCR-NUMEROS-NAO-ENCONTRADOS-GERADOS",
    data: dataCSV,
  });

  generateCSV({
    filePath: "CCR-NÚMEROS-NÃO-ENCONTRADOS",
    data: dataNumbersNotFound,
  });
};

init();
