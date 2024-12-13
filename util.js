import csv from "csv-parser";
import fs from "fs";
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { writeFile } from "node:fs";
import { Buffer } from "node:buffer";

export const getDataByCSV = ({ filePath, onData, onEnd }) => {
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => onData())
    .on("end", () => onEnd());
};

export const genereateJSONFile = ({ filePath, data }) => {
  fs.writeFile(filePath, data, "utf8", (err) => {
    if (err) {
      console.error("Ocorreu um erro ao gravar o arquivo JSON:", err);
      return;
    }
  });
};

export const generateCSV = ({ filePath, data }) => {
  const csvConfig = mkConfig({ useKeysAsHeaders: true });
  const csv = generateCsv(csvConfig)(data);
  const filename = `${filePath}.csv`;
  const csvBuffer = new Uint8Array(Buffer.from(asString(csv)));

  // Write the csv file to disk
  writeFile(filename, csvBuffer, (err) => {
    if (err) throw err;
  });
};

export const sleep = (time = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

export const getDataExtraction = ({ filePath, fn, separator = ";" }) => {
  return new Promise((resolve, _) => {
    const response = [];
    let index = 0;
    fs.createReadStream(filePath)
      .pipe(csv({ separator }))
      .on("data", (data) => {
        response.push(data);
        fn(data, index);
        index++;
      })
      .on("end", () => {
        resolve(response);
      });
  });
};

export const deleteFile = (filePath, fnError = () => {}) => {
  fs.unlink(filePath, function (err) {
    if (err) fnError();
  });
};
