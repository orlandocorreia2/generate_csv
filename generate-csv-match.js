import { deleteFile, generateCSV, getDataExtraction, sleep } from "./util.js";

const init = async () => {
  console.log("Proccessing generate csv match");

  const dataEmail = {};
  const dataKibana = [];
  const kibanaNumbers = {};
  const numbersNotFound = [];
  const matchData = [];

  deleteFile("EP-NÚMEROS-NÃO-ENCONTRADOS.csv");
  deleteFile("EP-NÚMEROS-ENCONTRADOS.csv");

  await sleep(1500);

  await getDataExtraction({
    filePath: "files/email/EP-SETEMBRO.csv",
    fn: (data) => (dataEmail[data.numeropropostaporto] = data),
  });

  await getDataExtraction({
    filePath: "files/kibana/EP-EXTRACAO-ORLANDO.csv",
    fn: (data, index) => {
      const dataParsed = JSON.parse(data.JSON);
      dataKibana.push(dataParsed);
      kibanaNumbers[dataParsed.calculo.numero] = { index };
    },
  });

  Object.keys(dataEmail).forEach((dataEmailNumber) => {
    if (!kibanaNumbers[dataEmailNumber]) numbersNotFound.push(dataEmailNumber);

    if (kibanaNumbers[dataEmailNumber]) {
      matchData.push({
        empresa: 4,
        produto: 151,
        num_orcamento: dataEmailNumber,
        json: JSON.stringify(dataKibana[kibanaNumbers[dataEmailNumber].index]),
      });
    }
  });

  const dataNumbersNotFound = numbersNotFound.map((number) => ({
    numeropropostaporto: number,
    valor: "N/A",
  }));

  generateCSV({
    filePath: "EP-NÚMEROS-NÃO-ENCONTRADOS",
    data: dataNumbersNotFound,
  });

  generateCSV({
    filePath: "EP-NÚMEROS-ENCONTRADOS",
    data: matchData,
  });

  const totalRegistrosEmail = Object.keys(dataEmail).length;
  const totalRegistrosEncontrados =
    totalRegistrosEmail - numbersNotFound.length;

  console.log({
    produto: "EP",
    totalRegistrosEmail,
    totalRegistrosEncontrados,
    totalRegistrosNaoEncontrados: numbersNotFound.length,
    qtdNumerosEncontradosNoKibanaRepetidos:
      dataKibana.length - totalRegistrosEmail,
  });
};

init();
