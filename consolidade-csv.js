import fs from "fs";
import { generateCSV, getDataExtraction } from "./util.js";

const init = async () => {
  console.log("Processing...");
  const dimensionFile = {};
  const dataCoberturas = {};
  const dataCapitais = {};
  const ctrDimension = [];
  const dataCSVEP = [];
  const dataCSVCCR = [];
  const numerosPropostaPorto = { ep: {}, ccr: {} };
  let found = 0;
  let notFound = 0;
  let timerProccess = 0;

  fs.unlink("EP-CONSOLIDADO.csv", function (err) {
    if (err) console.log("File non exists!");
  });

  fs.unlink("CCR-CONSOLIDADO.csv", function (err) {
    if (err) console.log("File non exists!");
  });

  await getDataExtraction({
    filePath: "files/email/EP-SETEMBRO.csv",
    fn: (data) => (numerosPropostaPorto.ep[data.numeropropostaporto] = true),
    separator: ";",
  });

  await getDataExtraction({
    filePath: "files/email/CCR-AGOSTO.csv",
    fn: (data) => {
      numerosPropostaPorto.ccr[data.numeropropostaporto] = true;
    },
    separator: ";",
  });

  await getDataExtraction({
    filePath: "files/email/CCR-SETEMBRO.csv",
    fn: (data) => {
      numerosPropostaPorto.ccr[data.numeropropostaporto] = true;
    },
    separator: ";",
  });

  await getDataExtraction({
    filePath: "files/jupyter_colunado/dimensao-41708.csv",
    fn: (data, index) => {
      if (index > 0) {
        const produto = data["calculo.codigoProdutoVida"]
          .toString()
          .toLowerCase();
        const numeropropostaporto =
          data.ctr.length == 10
            ? data.ctr.substring(2, data.ctr.length)
            : data.ctr;
        const hasNumeroProposta =
          numerosPropostaPorto[produto][numeropropostaporto];

        // console.log(
        //   produto,
        //   numeropropostaporto,
        //   numerosPropostaPorto[produto]
        // );

        if (hasNumeroProposta) {
          console.log(
            "kkkkkkkkkkkkkkkkkkkkkk",
            data.ctr,
            numeropropostaporto,
            hasNumeroProposta
          );
        }

        dimensionFile[data.ctr] = data;
        ctrDimension.push(data.ctr);
      }
    },
  });

  return;

  await getDataExtraction({
    filePath: "files/jupyter_colunado/resultado-41708.csv",
    fn: (data) => {
      const dimensionData = dimensionFile[data.ctr];
      const dimensionDataKeys = Object.keys(dimensionData);
      const isEP = dimensionData["calculo.codigoProdutoVida"] == "EP";
      const isCCR = dimensionData["calculo.codigoProdutoVida"] == "CCR";
      let qtdCoberturas = [];
      const dimensionCapitais = {
        contratantes: [],
        grupos: [],
        segurados: [],
        coberturas: [],
      };
      const dataKeys = Object.keys(data);
      dataKeys.forEach((dataKey) => {
        const splitPeriod = dataKey.split(".");
        const splitTypeArray = splitPeriod[2]?.split("_");
        if (splitTypeArray && splitTypeArray[0] == "coberturas") {
          if (!qtdCoberturas.includes(splitTypeArray[1]))
            qtdCoberturas.push(splitTypeArray[1]);
        }
      });

      dimensionDataKeys.forEach((dimensionDataKey) => {
        const splitDimensionPeriod = dimensionDataKey.split(".");
        // Contratantes
        if (splitDimensionPeriod[1]) {
          const splitDimensionContratantes = splitDimensionPeriod[1].split("_");
          if (
            splitDimensionContratantes[0] &&
            splitDimensionContratantes[0] == "contratantes" &&
            splitDimensionContratantes[1] &&
            !dimensionCapitais.contratantes.includes(
              splitDimensionContratantes[1]
            )
          ) {
            dimensionCapitais.contratantes.push(splitDimensionContratantes[1]);
          }
        }
        // Grupos
        if (splitDimensionPeriod[2]) {
          const splitDimensionGrupos = splitDimensionPeriod[2].split("_");
          if (
            splitDimensionGrupos[0] &&
            splitDimensionGrupos[0] == "grupos" &&
            splitDimensionGrupos[1] &&
            !dimensionCapitais.grupos.includes(splitDimensionGrupos[1])
          ) {
            dimensionCapitais.grupos.push(splitDimensionGrupos[1]);
          }
        }
        // Segurados
        if (splitDimensionPeriod[3]) {
          const splitDimensionSegurados = splitDimensionPeriod[3].split("_");
          if (
            splitDimensionSegurados[0] &&
            splitDimensionSegurados[0] == "segurados" &&
            splitDimensionSegurados[1] &&
            !dimensionCapitais.segurados.includes(splitDimensionSegurados[1])
          ) {
            dimensionCapitais.segurados.push(splitDimensionSegurados[1]);
          }
        }
        // Coberturas
        if (splitDimensionPeriod[4]) {
          const splitDimensionCoberturas = splitDimensionPeriod[4].split("_");
          if (
            splitDimensionCoberturas[0] &&
            splitDimensionCoberturas[0] == "coberturas" &&
            splitDimensionCoberturas[1] &&
            !dimensionCapitais.coberturas.includes(splitDimensionCoberturas[1])
          ) {
            dimensionCapitais.coberturas.push(splitDimensionCoberturas[1]);
          }
        }
      });
      // calculo.contratantes_0.grupos_0.segurados_0.coberturas_3.valor

      qtdCoberturas.forEach((qtdCobertura) => {
        const sigla =
          data[`retornoCalculo.precificacao.coberturas_${qtdCobertura}.sigla`];
        if (
          (isEP && !["CAP", "FIN", "PROF"].includes(sigla)) ||
          (isCCR && !["CAP"].includes(sigla))
        ) {
          dataCoberturas[`SIGLA COB ${qtdCobertura}`] =
            data[
              `retornoCalculo.precificacao.coberturas_${qtdCobertura}.sigla`
            ];
          dataCoberturas[`IOF COB ${qtdCobertura}`] =
            data[`retornoCalculo.precificacao.coberturas_${qtdCobertura}.iof`];
          dataCoberturas[`PRÊMIO COMERCIAL COB ${qtdCobertura}`] =
            data[
              `retornoCalculo.precificacao.coberturas_${qtdCobertura}.premio.comercial`
            ];
          dataCoberturas[`PRÊMIO PURO COB ${qtdCobertura}`] =
            data[
              `retornoCalculo.precificacao.coberturas_${qtdCobertura}.premio.puro`
            ];
          dataCoberturas[`PRÊMIO TOTAL COB ${qtdCobertura}`] =
            data[
              `retornoCalculo.precificacao.coberturas_${qtdCobertura}.premio.total`
            ];
        }
      });

      dimensionCapitais.contratantes.forEach(
        (_, dimensionCapitalContratantesIndex) => {
          dimensionCapitais.grupos.forEach((_, dimensionCapitalGruposIndex) => {
            dimensionCapitais.segurados.forEach(
              (_, dimensionCapitalSeguradosIndex) => {
                dimensionCapitais.coberturas.forEach(
                  (_, dimensionCapitalCoberturasIndex) => {
                    dimensionDataKeys.forEach((dimensionDataKey) => {
                      const dimensionKeyVefify = `calculo.contratantes_${dimensionCapitalContratantesIndex}.grupos_${dimensionCapitalGruposIndex}.segurados_${dimensionCapitalSeguradosIndex}.coberturas_${dimensionCapitalCoberturasIndex}.valor`;
                      if (dimensionDataKey == dimensionKeyVefify) {
                        const capitalKey = `CAPITAL CONTRATANTE_${dimensionCapitalContratantesIndex} GRUPO_${dimensionCapitalGruposIndex} SEGURADO_${dimensionCapitalSeguradosIndex} COBERTURA_${dimensionCapitalCoberturasIndex}`;
                        dataCapitais[capitalKey] =
                          dimensionData[dimensionKeyVefify];
                      }
                    });
                  }
                );
              }
            );
          });
        }
      );

      const dataPush = {
        "CODIGO PRODUTO VIDA": dimensionData["calculo.codigoProdutoVida"],
        "NÚMERO DA PROPOSTA": data.ctr,
        "IOF APÓLICE": data["retornoCalculo.precificacao.iof"],
        "PRÊMIO PURO APÓLICE": data["retornoCalculo.precificacao.premio.puro"],
        "PRÊMIO COMERCIAL APÓLICE":
          data["retornoCalculo.precificacao.premio.comercial"],
        "PRÊMIO TOTAL APÓLICE":
          data["retornoCalculo.precificacao.premio.total"],
        ...dataCoberturas,
        ...dataCapitais,
      };

      if (isEP) dataCSVEP.push(dataPush);
      if (isCCR) dataCSVCCR.push(dataPush);

      if (dimensionData) found++;
      if (!dimensionData) notFound++;
    },
  });

  generateCSV({ filePath: "EP-CONSOLIDADO", data: dataCSVEP });
  generateCSV({ filePath: "CCR-CONSOLIDADO", data: dataCSVCCR });

  console.log("Finish:", {
    time: `${timerProccess} second${timerProccess > 1 ? "s" : ""}`,
    found,
    notFound,
  });

  clearInterval(timer);
};

init();
