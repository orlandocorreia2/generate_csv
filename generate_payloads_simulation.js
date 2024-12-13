import fs from "fs";
import { genereateJSONFile, getDataExtraction, sleep } from "./util.js";

const init = async () => {
  let hasCache = 0;
  const dataToCSV = {};

  let hasRepetitive = 0;
  let hasNoRequest = 0;

  if (fs.existsSync("files/dimensao_resultado")) {
    await fs.rmdirSync("files/dimensao_resultado", {
      recursive: true,
      force: true,
    });
  }

  await sleep(3000);

  await fs.mkdirSync("files/dimensao_resultado");

  await getDataExtraction({
    filePath: "files/SIMULADOR_SINAPSE_RESULTADO_ID_SIMULACAO_42333.csv",
    fn: (data) => {
      if (dataToCSV[data.NUM_CALCULO]) hasRepetitive++;
      dataToCSV[data.NUM_CALCULO] = { response: data.JSON };
    },
    separator: ",",
  });

  await getDataExtraction({
    filePath: "files/SIMULADOR_SINAPSE_DIMENSAO_ID_SIMULACAO_42333.csv",
    fn: (data) => {
      if (dataToCSV[data.NUM_CALCULO]) {
        dataToCSV[data.NUM_CALCULO] = {
          request: data.JSON,
          ...dataToCSV[data.NUM_CALCULO],
        };
      } else {
        hasNoRequest++;
      }
    },
    separator: ",",
  });

  Object.keys(dataToCSV).forEach((keyData, index) => {
    genereateJSONFile({
      filePath: `files/dimensao_resultado/${index}_payload.json`,
      data: JSON.stringify({
        request: JSON.parse(dataToCSV[keyData].request),
        response: JSON.parse(dataToCSV[keyData].response),
      }),
    });
  });

  console.log("Finish", {
    hasCache,
    hasRepetitive,
    hasNoRequest,
    totalData: Object.keys(dataToCSV).length,
  });
};

init();
