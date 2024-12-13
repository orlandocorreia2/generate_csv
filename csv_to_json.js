import { genereateJSONFile, getDataExtraction } from "./util.js";

const execute = async () => {
  const dataFile = [];
  await getDataExtraction({
    filePath: "files/kibana/Kibana Logs.csv",
    fn: (data, index) => {
      try {
        const request = JSON.parse(data.request);
        const response = JSON.parse(data.response);
        dataFile.push({ request, response });
      } catch (error) {}
    },
    separator: ";",
  });

  const dataJsonFile = dataFile.map((item) => item);

  genereateJSONFile({
    filePath: "payloads.json",
    data: JSON.stringify({ data: dataJsonFile }),
  });
};

execute();
