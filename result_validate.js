import { deleteFile, generateCSV, getDataExtraction } from "./util.js";

const init = async () => {
  console.log("Processing consolidade EP...");
  let totalRegisters = 0;
  let hasHistories = 0;

  await getDataExtraction({
    filePath: "files/result.csv",
    fn: (data) => {
      totalRegisters++;
      const dataParsed = JSON.parse(data.JSON);
      if (dataParsed.retornoCalculo.itens[0].complementar.historico === true) {
        hasHistories++;
      }
    },
    separator: ",",
  });

  console.log("Finish:", { totalRegisters, hasHistories });
};

init();
