import { deleteFile, generateCSV, getDataExtraction } from "./util.js";

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
  const dataFixedCSV1 = [];
  const dataFixedCSV2 = [];
  let countDataFixed = 0;

  deleteFile("CCR-CENÁRIOS-CORRIGIDOS-1.csv");
  deleteFile("CCR-CENÁRIOS-CORRIGIDOS-2.csv");

  await getDataExtraction({
    filePath: "files/email/CCR-AGOSTO.csv",
    fn: (data) => (dataEmail[data.numeropropostaporto] = data),
  });

  await getDataExtraction({
    filePath: "files/email/CCR-SETEMBRO.csv",
    fn: (data) => (dataEmail[data.numeropropostaporto] = data),
  });

  for (let i = 1; i < 3; i++) {
    await getDataExtraction({
      filePath: `CCR-NÚMEROS-ENCONTRADOS-${i}.csv`,
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
          const dataPush = {
            empresa: 4,
            produto: data.produto,
            num_orcamento: `18${data.num_orcamento}`,
            json: JSON.stringify({
              naoSalvarDados: true,
              ...jsonParsed,
              calculo: fixedCalculation,
            }),
          };
          if (countDataFixed < 80000) {
            dataFixedCSV1.push(dataPush);
          } else {
            dataFixedCSV2.push(dataPush);
          }
          countDataFixed++;
        }
      },
      separator: ",",
    });
  }

  generateCSV({
    filePath: "CCR-CENÁRIOS-CORRIGIDOS-1",
    data: dataFixedCSV1,
  });

  generateCSV({
    filePath: "CCR-CENÁRIOS-CORRIGIDOS-2",
    data: dataFixedCSV2,
  });

  console.log("Finish", {
    totalEmail: Object.keys(dataEmail).length,
    totalFixed: dataFixedCSV1.length + dataFixedCSV2.length,
  });

  return;
};

init();
