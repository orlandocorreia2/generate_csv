import { deleteFile, generateCSV, getDataExtraction, sleep } from "./util.js";

const init = async () => {
  console.log("Proccessing generate csv match");
  const dataEmail = {};
  const dataKibana = [];
  const kibanaNumbers = {};
  const numbersNotFound = [];
  const matchData1 = [];
  const matchData2 = [];
  let countMatchData = 0;

  deleteFile("CCR-NÚMEROS-NÃO-ENCONTRADOS.csv");
  deleteFile("CCR-NÚMEROS-ENCONTRADOS-1.csv");
  deleteFile("CCR-NÚMEROS-ENCONTRADOS-2.csv");

  await getDataExtraction({
    filePath: "files/email/CCR-AGOSTO.csv",
    fn: (data) => (dataEmail[data.numeropropostaporto] = data),
  });

  await getDataExtraction({
    filePath: "files/email/CCR-SETEMBRO.csv",
    fn: (data) => (dataEmail[data.numeropropostaporto] = data),
  });

  for (let i = 1; i < 4; i++) {
    await getDataExtraction({
      filePath: `CCR-JOINED-PARTE-${i}.csv`,
      fn: (data, index) => {
        const dataParsed = JSON.parse(data["message.inputStr"]);
        dataKibana.push(dataParsed);
        kibanaNumbers[dataParsed.calculo.numero] = { index };
      },
      separator: ",",
    });
  }

  Object.keys(dataEmail).forEach((dataEmailNumber) => {
    if (!kibanaNumbers[dataEmailNumber]) numbersNotFound.push(dataEmailNumber);

    if (kibanaNumbers[dataEmailNumber]) {
      const dataPush = {
        empresa: 4,
        produto: 151,
        num_orcamento: dataEmailNumber,
        json: JSON.stringify(dataKibana[kibanaNumbers[dataEmailNumber].index]),
      };
      if (countMatchData < 80000) {
        matchData1.push(dataPush);
      } else {
        matchData2.push(dataPush);
      }
      countMatchData++;
    }
  });

  const dataNumbersNotFound = numbersNotFound.map((number) => ({
    numeropropostaporto: number,
    valor: "N/A",
  }));

  generateCSV({
    filePath: "CCR-NÚMEROS-NÃO-ENCONTRADOS",
    data: dataNumbersNotFound,
  });

  generateCSV({
    filePath: "CCR-NÚMEROS-ENCONTRADOS-1",
    data: matchData1,
  });

  generateCSV({
    filePath: "CCR-NÚMEROS-ENCONTRADOS-2",
    data: matchData2,
  });

  const totalRegistrosEmail = Object.keys(dataEmail).length;
  const totalRegistrosEncontrados =
    totalRegistrosEmail - numbersNotFound.length;

  console.log("Finish...", {
    produto: "CCR",
    totalRegistrosEmail,
    totalRegistrosEncontrados,
    totalRegistrosNaoEncontrados: numbersNotFound.length,
    qtdNumerosEncontradosNoKibanaRepetidos:
      dataKibana.length - totalRegistrosEmail,
  });
};

init();
