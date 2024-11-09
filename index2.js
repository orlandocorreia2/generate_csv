import csv from 'csv-parser';
import fs from 'fs';
import { generateCSV } from './util.js';

const getDataExtraction = ({filePath, fn}) => {
  return new Promise((resolve, _) => {
    const response = [];
    fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      response.push(data);
      fn(data)
    })
    .on("end", () => {
      resolve(response);
    });
  }) 
}

const fixCalculationInformations = ({calculo, premio_informado, parcelas, valor_divida}) => {
  calculo.precificacao.premio.informado = parseFloat(premio_informado);
  calculo.contratantes.forEach(calculoContratante => {
    calculoContratante.dadosPagamento.quantidadeParcelas = parseFloat(parcelas);
    calculoContratante.grupos.forEach(calculoContratanteGrupo => {
      calculoContratanteGrupo.segurados.forEach(calculoContratanteGrupoSegurado => {
        calculoContratanteGrupoSegurado.coberturas.forEach(calculoContratanteGrupoSeguradoCobertura => {
          if (['RIT', 'DES'].includes(calculoContratanteGrupoSeguradoCobertura.sigla)) {
            calculoContratanteGrupoSeguradoCobertura.valor = parseFloat(valor_divida);
          }
        })
      })
    })
  })
  calculo.remuneracoes.forEach(remuneracao => {
    if (remuneracao.tipoRemuneracao == 'REP') remuneracao.percentual = 70;
    if (remuneracao.tipoRemuneracao == 'COR') remuneracao.percentual = 1.8;
  })
  return calculo;
}

const removeFilesGenerated = () => {
  const filesPath = [
    'EXTRACAO-CORRIGIDA.csv',
    'NUMEROS-NAO-ENCONTRADOS.csv'
  ];
  filesPath.forEach(filePath => {
    fs.unlink(filePath, function (err){
      if (err) console.log('File non exists!');
    })
  });
}

const generate = async () => {
  console.log('Processing...');
  const dataExtractionKibana = {};
  const dataFilesEmail = [];
  const cauculationsFixed = [];
  const portoNumbers = [];
  const numbersDuplicated = [];
  const portoNumbersNotFound = [];
  // let timerProccess = 0;
  // const timer = setInterval(() => {
  //   timerProccess++;
  // }, 1000);

  const filesKibanaName = fs.readdirSync('files/kibana').map(fileName => `files/kibana/${fileName}`);
  const filesEmailName = fs.readdirSync('files/email').map(fileName => `files/email/${fileName}`);

  console.log(filesKibanaName,  'kkkkkkkkkkkkkkkkkk', filesEmailName)

  removeFilesGenerated();

  await getDataExtraction({filePath: 'files/kibana/EP/EP-SETEMBRO-EXTRACAO-HANGRA.csv', fn: (data) => {
    const [_, json] = data['orc;json'].split(';');
    if (json != '#N/D') {
      const dataParsed = JSON.parse(json.substr(1, json.length - 2));
      if (dataExtractionKibana[dataParsed.calculo.numero]) numbersDuplicated.push({type: 'EP', value: dataParsed.calculo.numero});
      dataExtractionKibana[dataParsed.calculo.numero] = dataParsed;
    }
  }});

  for (let filePath of filesKibanaName) {
    await getDataExtraction({filePath, fn: (data) => {
      let type = 'CCR';
      if (filePath == 'files/kibana/EP-SETEMBRO-EXTRACAO.csv') {
        const [_, json] = data['orc;json'].split(';');
        if (json != '#N/D') {
          const dataParsed = JSON.parse(json.substr(1, json.length - 2));
          if (dataExtractionKibana[dataParsed.calculo.numero]) numbersDuplicated.push({type: 'EP', value: dataParsed.calculo.numero});
          dataExtractionKibana[dataParsed.calculo.numero] = dataParsed;
        }
      } else {
        const dataParsed = JSON.parse(data['message.inputStr']);
        portoNumbers.push({type: 'CCR', value: dataParsed.calculo.numero});
        if (dataExtractionKibana[dataParsed.calculo.numero]) numbersDuplicated.push({type: 'CCR', value: dataParsed.calculo.numero});
        dataExtractionKibana[dataParsed.calculo.numero] = dataParsed;
      }
      
    }});
  }

  for (let filenameEmail of filenamesEmail) {
    await getDataExtraction({filePath: `files/email/${filenameEmail}`, fn: (data) => {
      dataFilesEmail.push(data);
    }});
  }

  dataFilesEmail.forEach(dataFileEmail => {
    const findData = dataExtractionKibana[dataFileEmail.numeropropostaporto];
    if (findData) {
      const fixedCalculation = fixCalculationInformations({calculo: findData.calculo, ...dataFileEmail});
      cauculationsFixed.push({naoSalvarDados: true, ...findData, calculo: fixedCalculation });
    } else {
      portoNumbersNotFound.push({type: dataFileEmail.produto, numeropropostaporto: dataFileEmail.numeropropostaporto, value: 'N/A'});
    }
  })

  const generateDate = cauculationsFixed.map(item => ({
    empresa: 4,
    produto: 151,
    num_orcamento: item.orcnum,
    json: JSON.stringify(item)
  }));

  generateCSV({filePath: 'NUMEROS-NAO-ENCONTRADOS', data: portoNumbersNotFound})
  generateCSV({filePath: 'EXTRACAO-CORRIGIDA', data: generateDate})

  console.log('Finish:', {
    time: `${timerProccess} second${timerProccess > 1 ? 's' : ''}`
  });

  clearInterval(timer);
}

generate();










