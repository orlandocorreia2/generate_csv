import { deleteFile, generateCSV, getDataExtraction } from "./util.js";

const init = async () => {
  console.log("Processing consolidade CCR...");
  const dataResult = {};
  const dataGenerateFile = [];
  const dataDimension = {};
  const numbersNotFound = {};

  deleteFile("CCR-NUMEROS-NAO-ENCONTRADOS-CONSOLIDADO.csv");

  await getDataExtraction({
    filePath: "files/email/CCR-NÚMEROS-NÃO-ENCONTRADOS.csv",
    fn: (data) => {
      numbersNotFound[`18${data[Object.keys(data)[0]]}`] = true;
    },
  });

  await getDataExtraction({
    filePath: "files/jupyter_colunado/resultado-42248.csv",
    fn: (data) => {
      const ctr = data.ctr;
      if (numbersNotFound[ctr]) {
        dataResult[ctr] = data;
      }
    },
  });

  let hasRepetitiveDimension = 0;
  const dimensionRepetitive = {};

  await getDataExtraction({
    filePath: "files/jupyter_colunado/dimensao-42248.csv",
    fn: (data) => {
      const dimensionData = data;
      const resultData = dataResult[data.ctr];

      if (dimensionRepetitive[data.ctr]) hasRepetitiveDimension++;

      dimensionRepetitive[data.ctr] = true;

      if (resultData && !dataDimension[data.ctr]) {
        dataDimension[data.ctr] = true;
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
          "Número Proposta": data.ctr.toString().substring(2, 10),
          "Prêmio Puro": resultData["retornoCalculo.precificacao.premio.puro"],
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
    },
  });

  if (dataGenerateFile.length) {
    generateCSV({
      filePath: "CCR-NUMEROS-NAO-ENCONTRADOS-CONSOLIDADO",
      data: dataGenerateFile,
    });
  }

  console.log("Finish:", {
    total: dataGenerateFile.length,
    totalDimension: dataGenerateFile.length,
    totalResult: Object.keys(dataResult).length,
    hasRepetitiveDimension,
  });
};

init();
