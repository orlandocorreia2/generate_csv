import { deleteFile, generateCSV, getDataExtraction, sleep } from "./util.js";
import body from "./inputStr.js";

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

  const numbersNotFound = {};

  const dataCSV = [];

  deleteFile("EP-NUMEROS-NAO-ENCONTRADOS-GERADOS.csv");

  await getDataExtraction({
    filePath: "files/email/EP-NÚMEROS-NÃO-ENCONTRADOS.csv",
    fn: (data) => {
      numbersNotFound[data.valor] = true;
    },
  });

  await getDataExtraction({
    filePath: "files/email/EP-SETEMBRO.csv",
    fn: (data) => {
      if (numbersNotFound[data.numeropropostaporto]) {
        const dataFixed = fixCalculationInformations({
          calculo: body.calculo,
          parcelas: data.parcelas,
          valor_divida: data.valor_divida,
          premio_informado: data.premio_informado,
        });

        dataCSV.push({
          empresa: 4,
          produto: 151,
          num_orcamento: `18${data.numeropropostaporto}`,
          json: JSON.stringify({
            naoSalvarDados: true,
            calculo: dataFixed,
          }),
        });
      }
    },
  });

  generateCSV({
    filePath: "EP-NUMEROS-NAO-ENCONTRADOS-GERADOS",
    data: dataCSV,
  });
};

init();
