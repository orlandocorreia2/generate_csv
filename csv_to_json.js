import { genereateJSONFile, getDataExtraction } from "./util.js";

const execute = async () => {
  const dataFile = [];
  await getDataExtraction({
    filePath: "files/payloadsRenovacao.csv",
    fn: (data) => {
      try {
        dataFile.push(JSON.parse(data.Column2));
      } catch (error) {}
    },
    separator: ";",
  });

  console.log(dataFile[0], dataFile.length);

  // const dataParsed = JSON.parse(dataFile[1].Column2).calculo;

  // console.log(dataParsed);

  const dataJsonFile = dataFile.map((item) => item);

  genereateJSONFile({
    filePath: "payloads.json",
    data: JSON.stringify({ data: dataJsonFile }),
  });
};

execute();
