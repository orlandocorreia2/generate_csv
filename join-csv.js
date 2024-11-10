import fs from "fs";
import { deleteFile, generateCSV, getDataExtraction } from "./util.js";

const init = async () => {
  console.log("Processing...");
  const part = 3;
  // deleteFile("CCR-JOINED.csv");
  const filenames = fs.readdirSync(`files/kibana/CCR/part${part}`);
  const allDataFiles = [];

  for (let fileName of filenames) {
    await getDataExtraction({
      filePath: `files/kibana/CCR/part${part}/${fileName}`,
      fn: (data) => {
        allDataFiles.push(data);
      },
      separator: ",",
    });
  }

  generateCSV({
    filePath: `CCR-JOINED-PARTE-${part}`,
    data: allDataFiles,
  });

  console.log(allDataFiles.length);
};

init();
