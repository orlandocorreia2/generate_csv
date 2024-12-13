import { deleteFile, generateCSV, getDataExtraction } from "./util.js";

const init = async () => {
  console.log("Processing consolidade EP...");
  const dataResult = {};
  const dataDimension = {};
  const dataCoberturas = {};
  const dataCapitais = {};
  const dataGenerateFile = [];

  deleteFile("EP-CONSOLIDADO");

  await getDataExtraction({
    filePath: "files/jupyter_colunado/resultado - 41808.csv",
    fn: (data) => {
      const ctr = data.ctr;
      if (ctr >= 1810264908 && ctr <= 1810265471) {
        dataResult[ctr] = data;
      }
    },
  });

  await getDataExtraction({
    filePath: "files/jupyter_colunado/dimensao - 41808.csv",
    fn: (data, index) => {
      const dimensionData = data;
      const numero = data["calculo.numero"];
      const resultData = dataResult[`18${numero}`];

      if (
        numero >= 10264908 &&
        numero <= 10265471 &&
        resultData &&
        !dataDimension[numero]
      ) {
        dataDimension[numero] = data;
        if (dimensionData) {
          const dimensionDataKeys = Object.keys(dimensionData);
          let qtdCoberturas = [];
          const dimensionCapitais = {
            contratantes: [],
            grupos: [],
            segurados: [],
            coberturas: [],
          };
          const dataKeys = Object.keys(resultData);
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
              const splitDimensionSegurados =
                splitDimensionPeriod[3].split("_");
              if (
                splitDimensionSegurados[0] &&
                splitDimensionSegurados[0] == "segurados" &&
                splitDimensionSegurados[1] &&
                !dimensionCapitais.segurados.includes(
                  splitDimensionSegurados[1]
                )
              ) {
                dimensionCapitais.segurados.push(splitDimensionSegurados[1]);
              }
            }
            // Coberturas
            if (splitDimensionPeriod[4]) {
              const splitDimensionCoberturas =
                splitDimensionPeriod[4].split("_");
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
              resultData[
                `retornoCalculo.precificacao.coberturas_${qtdCobertura}.sigla`
              ];
            if (!["CAP", "FIN", "PROF"].includes(sigla)) {
              dataCoberturas[`SIGLA COB ${qtdCobertura}`] =
                resultData[
                  `retornoCalculo.precificacao.coberturas_${qtdCobertura}.sigla`
                ];
              dataCoberturas[`IOF COB ${qtdCobertura}`] =
                resultData[
                  `retornoCalculo.precificacao.coberturas_${qtdCobertura}.iof`
                ];
              dataCoberturas[`PRÊMIO COMERCIAL COB ${qtdCobertura}`] =
                resultData[
                  `retornoCalculo.precificacao.coberturas_${qtdCobertura}.premio.comercial`
                ];
              dataCoberturas[`PRÊMIO PURO COB ${qtdCobertura}`] =
                resultData[
                  `retornoCalculo.precificacao.coberturas_${qtdCobertura}.premio.puro`
                ];
              dataCoberturas[`PRÊMIO TOTAL COB ${qtdCobertura}`] =
                resultData[
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

          let dimensionCapitals = {};

          for (let i = 0; i <= 6; i++) {
            const siglaResult =
              resultData[`retornoCalculo.precificacao.coberturas_${i}.sigla`];

            switch (siglaResult) {
              case "BAS":
                dimensionCapitals["Capital Segurado"] =
                  dimensionData[
                    `calculo.contratantes_0.grupos_0.segurados_0.coberturas_${i}.valor`
                  ];
                dimensionCapitals["Prêmio Puro Morte"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.puro`
                  ];
                dimensionCapitals["Prêmio Comercial Morte"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.comercial`
                  ];
                dimensionCapitals["IOF Morte"] =
                  resultData[`retornoCalculo.precificacao.coberturas_${i}.iof`];
                dimensionCapitals["Prêmio Total Morte"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.total`
                  ];
                break;
              case "IPTA":
                dimensionCapitals["Capital Segurado 2"] =
                  dimensionData[
                    `calculo.contratantes_0.grupos_0.segurados_0.coberturas_${i}.valor`
                  ];
                dimensionCapitals["Prêmio Puro IPTA"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.puro`
                  ];
                dimensionCapitals["Prêmio Comercial IPTA"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.comercial`
                  ];
                dimensionCapitals["IOF IPTA"] =
                  resultData[`retornoCalculo.precificacao.coberturas_${i}.iof`];
                dimensionCapitals["Prêmio Total IPTA"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.total`
                  ];
                break;

              case "RIT":
                dimensionCapitals["Capital Segurado 3"] =
                  dimensionData[
                    `calculo.contratantes_0.grupos_0.segurados_0.coberturas_${i}.valor`
                  ];
                dimensionCapitals["Prêmio Puro RIT"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.puro`
                  ];
                dimensionCapitals["Prêmio Comercial RIT"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.comercial`
                  ];
                dimensionCapitals["IOF RIT"] =
                  resultData[`retornoCalculo.precificacao.coberturas_${i}.iof`];
                dimensionCapitals["Prêmio Total RIT"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.total`
                  ];
                break;

              case "DES":
                dimensionCapitals["Capital Segurado 4"] =
                  dimensionData[
                    `calculo.contratantes_0.grupos_0.segurados_0.coberturas_${i}.valor`
                  ];
                dimensionCapitals["Prêmio Puro DES"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.puro`
                  ];
                dimensionCapitals["Prêmio Comercial DES"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.comercial`
                  ];
                dimensionCapitals["IOF DES"] = dimensionCapitals["IOF DES"] =
                  resultData[`retornoCalculo.precificacao.coberturas_${i}.iof`];
                dimensionCapitals["Prêmio Total DES"] =
                  resultData[
                    `retornoCalculo.precificacao.coberturas_${i}.premio.total`
                  ];
                break;

              default:
                break;
            }
          }

          dataGenerateFile.push({
            "Número Proposta": dimensionData["calculo.numero"],
            "Prêmio Puro":
              resultData["retornoCalculo.precificacao.premio.puro"],
            "Prêmio Comercial":
              resultData["retornoCalculo.precificacao.premio.comercial"],
            IOF: resultData["retornoCalculo.precificacao.iof"],
            "Prêmio Total":
              resultData["retornoCalculo.precificacao.premio.total"],
            "Desconto Agravo":
              resultData[
                "retornoCalculo.precificacao.descontoAgravo_0.monetario"
              ],
            ...dimensionCapitals,
          });
        }
      }
    },
  });

  generateCSV({ filePath: "EP-CONSOLIDADO", data: dataGenerateFile });

  console.log("Finish:", {
    total: dataGenerateFile.length,
    totalDimension: Object.keys(dataDimension).length,
    totalResult: Object.keys(dataResult).length,
  });
};

init();
