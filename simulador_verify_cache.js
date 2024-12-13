import { deleteFile, generateCSV, getDataExtraction } from "./util.js";

const init = async () => {
  let hasCache = 0;

  await getDataExtraction({
    filePath: "files/SIMULADOR_SINAPSE_RESULTADO_ID_SIMULACAO_42333.csv",
    fn: (data) => {
      const jsonParsed = JSON.parse(data.JSON);
      const hasActualDll =
        jsonParsed.retornoCalculo.dlls.includes("pmte1p2520241217_4");
      if (!hasActualDll) {
        hasCache++;
      }
    },
    separator: ",",
  });

  console.log("Finish", { hasCache });
};

init();
