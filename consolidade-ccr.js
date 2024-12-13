import { deleteFile, generateCSV, getDataExtraction } from "./util.js";

const init = async () => {
  console.log("Processing consolidade CCR...");
  const dataDimension = {};
  const dataCoberturas = {};
  const dataCapitais = {};
  const dataGenerateFile = [];

  deleteFile("CCR-CONSOLIDADO");

  await getDataExtraction({
    filePath: "files/jupyter_colunado/dimensao-41829.csv",
    fn: (data, index) => {
      const numero = data["calculo.numero"];
      if (index == 0) {
        console.log(numero);
      }

      if (numero >= 22937975 && numero <= 23384524) {
        dataDimension[data.ctr] = data;
      }
    },
  });

  console.log(Object.keys(dataDimension).length);
  return;

  await getDataExtraction({
    filePath: "files/jupyter_colunado/resultado-41829.csv",
    fn: (data) => {
      const dimensionData = dataDimension[data.ctr];
      if (dimensionData) {
        const dimensionDataKeys = Object.keys(dimensionData);
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
            const splitDimensionContratantes =
              splitDimensionPeriod[1].split("_");
            if (
              splitDimensionContratantes[0] &&
              splitDimensionContratantes[0] == "contratantes" &&
              splitDimensionContratantes[1] &&
              !dimensionCapitais.contratantes.includes(
                splitDimensionContratantes[1]
              )
            ) {
              dimensionCapitais.contratantes.push(
                splitDimensionContratantes[1]
              );
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
              !dimensionCapitais.coberturas.includes(
                splitDimensionCoberturas[1]
              )
            ) {
              dimensionCapitais.coberturas.push(splitDimensionCoberturas[1]);
            }
          }
        });

        qtdCoberturas.forEach((qtdCobertura) => {
          const sigla =
            data[
              `retornoCalculo.precificacao.coberturas_${qtdCobertura}.sigla`
            ];
          if (!["CAP", "FIN", "PROF"].includes(sigla)) {
            dataCoberturas[`SIGLA COB ${qtdCobertura}`] =
              data[
                `retornoCalculo.precificacao.coberturas_${qtdCobertura}.sigla`
              ];
            dataCoberturas[`IOF COB ${qtdCobertura}`] =
              data[
                `retornoCalculo.precificacao.coberturas_${qtdCobertura}.iof`
              ];
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
            dimensionCapitais.grupos.forEach(
              (_, dimensionCapitalGruposIndex) => {
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
              }
            );
          }
        );

        dataGenerateFile.push({
          "NÚMERO DA PROPOSTA": dimensionData["calculo.numero"],
          "IOF APÓLICE": data["retornoCalculo.precificacao.iof"],
          "PRÊMIO PURO APÓLICE":
            data["retornoCalculo.precificacao.premio.puro"],
          "PRÊMIO COMERCIAL APÓLICE":
            data["retornoCalculo.precificacao.premio.comercial"],
          "PRÊMIO TOTAL APÓLICE":
            data["retornoCalculo.precificacao.premio.total"],
          ...dataCoberturas,
          ...dataCapitais,
        });
      }
    },
  });

  generateCSV({ filePath: "EP-CONSOLIDADO", data: dataGenerateFile });

  console.log("Finish:", {
    total: dataGenerateFile.length,
  });
};

init();
