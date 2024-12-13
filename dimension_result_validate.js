import { getDataExtraction } from "./util.js";

const init = async () => {
  console.log("Processing validate dimension result...");
  const requestsActual = {};
  const responsesActual = {};
  const requestsNew = {};
  const responsesNew = {};
  const diffs = {};

  let totalDimensionActual = 0;
  let totalResultActual = 0;
  let totalDimensionNew = 0;
  let totalResultNew = 0;
  let dllsNotUpdated = 0;

  await getDataExtraction({
    filePath: "files/dimensao_resultado/RESULTADO_42328.csv",
    fn: (data) => {
      totalResultActual++;
      const dataParsed = JSON.parse(data.JSON);
      const budgetNumber = dataParsed.retornoCalculo.numeroOrcamento;
      responsesActual[budgetNumber] = dataParsed;
    },
    separator: ",",
  });

  await getDataExtraction({
    filePath: "files/dimensao_resultado/DIMENSAO_42328.csv",
    fn: (data) => {
      totalDimensionActual++;
      const dataParsed = JSON.parse(data.JSON);
      const budgetNumber = dataParsed.calculo.dadosOrcamento.numeroOrcamento;
      if (responsesActual[budgetNumber]) {
        requestsActual[budgetNumber] = dataParsed;
      }
    },
    separator: ",",
  });

  await getDataExtraction({
    filePath: "files/dimensao_resultado/RESULTADO_42332.csv",
    fn: (data) => {
      totalResultNew++;
      const dataParsed = JSON.parse(data.JSON);
      const budgetNumber = dataParsed.retornoCalculo.numeroOrcamento;
      responsesNew[budgetNumber] = dataParsed;
      if (responsesActual[budgetNumber]) {
        responsesNew[budgetNumber] = { id: data.ID_DIMENSAO, ...dataParsed };
      }
    },
    separator: ",",
  });

  await getDataExtraction({
    filePath: "files/dimensao_resultado/DIMENSAO_42332.csv",
    fn: (data) => {
      totalDimensionNew++;
      const dataParsed = JSON.parse(data.JSON);
      const budgetNumber = dataParsed.calculo.dadosOrcamento.numeroOrcamento;
      if (responsesActual[budgetNumber] && responsesNew[budgetNumber]) {
        requestsNew[budgetNumber] = dataParsed;
      }
    },
    separator: ",",
  });

  Object.keys(responsesActual).forEach((item, index) => {
    const { retornoCalculo } = responsesActual[item];
    if (retornoCalculo.dlls.includes("pmte1p2520241217_4")) {
      const { numeroOrcamento } = retornoCalculo;
      const hasResponseNew = responsesNew[numeroOrcamento];
      const request = requestsActual[item];
      if (hasResponseNew) {
        const premioActual = retornoCalculo.premio.premioTotal;
        const premioNew = hasResponseNew.retornoCalculo.premio.premioTotal;
        if (
          premioActual != premioNew &&
          Math.abs(premioActual - premioNew) > 1
        ) {
          const fatorOtimizacaoPorto =
            retornoCalculo.itens[0].complementar.fatorOtimizacaoPorto;
          const fatorAplicadoSinapse =
            retornoCalculo.itens[0].complementar.servicos.otimizacao.fator;

          const actualCoverages = JSON.stringify(
            retornoCalculo.itens[0].coberturas
          );
          const newCoverages = JSON.stringify(
            responsesNew[item].retornoCalculo.items[0].coberturas
          );
          diffs[numeroOrcamento] = {
            id: hasResponseNew.id,
            cpfCNPJ: request.calculo.dadosOrcamento.cpfCnpj,
            numOrcamento: numeroOrcamento,
            premioActual,
            premioNew,
            diff: premioActual - premioNew,
            actualCoverages,
            newCoverages,
            // requestActual: JSON.stringify(requestsActual[numeroOrcamento]),
          };
        }
      }
    } else {
      dllsNotUpdated++;
    }
  });

  console.log("Finish:", {
    dllsNotUpdated,
    totalDiffs: Object.keys(diffs).length,
    diffs,
  });
};

init();
