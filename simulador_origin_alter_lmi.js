import { deleteFile, generateCSV, getDataExtraction } from "./util.js";

const init = async () => {
  const dataCSV = [];
  deleteFile("SIMULADOR_SINAPSE_ORIGEM.csv");

  await getDataExtraction({
    filePath: "files/SIMULADOR_SINAPSE_ORIGEM_E1_P204_T6_12_12_2024.csv",
    fn: (data) => {
      const calc = JSON.parse(data.JSON);

      calc.calculo.dadosOrcamento.itensOrcamento.forEach((item) => {
        item.coberturasContratadas.forEach((coverage) => {
          coverage.lmi += 0.1;
        });
      });
      dataCSV.push({
        empresa: data.EMPRESA,
        produto: data.PRODUTO,
        num_orcamento: data.NUM_ORCAMENTO,
        json: JSON.stringify(calc),
      });
    },
    separator: ",",
  });

  generateCSV({
    filePath: "SIMULADOR_SINAPSE_ORIGEM",
    data: dataCSV,
  });
};

init();
