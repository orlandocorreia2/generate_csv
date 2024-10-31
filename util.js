import csv from 'csv-parser';
import fs from 'fs';
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { writeFile } from "node:fs";
import { Buffer } from "node:buffer";

export const getDataByCSV = ({filePath, onData, onEnd}) => {
  fs.createReadStream(filePath)
  .pipe(csv())
  .on("data", (data) => onData())
  .on("end", () => onEnd());
}

export const genereateJSONFile = ({filePath, data}) => {
  fs.writeFile(filePath, data, 'utf8', (err) => {
    if (err) {
      console.error('Ocorreu um erro ao gravar o arquivo JSON:', err);
      return;
    }
    console.log('O arquivo JSON foi criado e gravado com sucesso.');
  });
}

export const generateCSV = ({filePath, data}) => {
  const csvConfig = mkConfig({  useKeysAsHeaders: true });
  const csv = generateCsv(csvConfig)(data);
  const filename = `${filePath}.csv`;
  const csvBuffer = new Uint8Array(Buffer.from(asString(csv)));
  
  // Write the csv file to disk
  writeFile(filename, csvBuffer, (err) => {
    if (err) throw err;
  });
}