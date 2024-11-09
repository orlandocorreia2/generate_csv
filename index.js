import csv from 'csv-parser';
import fs from 'fs';
import { generateCSV, sleep } from './util.js';

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

const generateEP = async () => {
  console.log('Processing...');
  const dataExtracao = {};
  const dataEpSeptember = [];
  const portoNumbersNotFound = [];
  let cauculationsFixed = [];
  let timerProccess = 0;
  const timer = setInterval(() => {
    timerProccess++;
  }, 1000);

  fs.unlink('EP-NUMEROS-NAO-ENCONTRADOS.csv', function (err){
    if (err) console.log('File non exists!');
  })

  fs.unlink('EP-SETEMBRO-EXTRACAO-CORRIGIDA.csv', function (err){
    if (err) console.log('File non exists!');
  })

  await getDataExtraction({filePath: 'files/kibana/EP/EP-SETEMBRO-EXTRACAO-HANGRA.csv', fn: (data) => {
    const [_, json] = data['orc;json'].split(';');
    if (json != '#N/D') {
      const dataParsed = JSON.parse(json.substr(1, json.length - 2));
      dataExtracao[dataParsed.calculo.numero] = dataParsed;
    }
  }});

  // await getDataExtraction({filePath: 'files/kibana/EP/EP-SETEMBRO-EXTRACAO.csv', fn: (data) => {
  //   const dataParsed = JSON.parse(data['message.inputStr']);
  //   dataExtracao[dataParsed.calculo.numero] = dataParsed;
  // }});

  await getDataExtraction({filePath: 'files/email/EP-SETEMBRO.csv', fn: (data) => {
    dataEpSeptember.push(data);
  }});

  dataEpSeptember.forEach(dataEpSeptemberItem => {
    const findData = dataExtracao[dataEpSeptemberItem.numeropropostaporto];
    if (findData) {
      const fixedCalculation = fixCalculationInformations({calculo: findData.calculo, ...dataEpSeptemberItem});
      cauculationsFixed.push({naoSalvarDados: true, ...findData, calculo: fixedCalculation });
    } else {
      portoNumbersNotFound.push(dataEpSeptemberItem.numeropropostaporto);
    }
  })

  const generateDate = cauculationsFixed.map(item => ({
    empresa: 4,
    produto: 151,
    num_orcamento: item.orcnum,
    json: JSON.stringify(item)
  }));

  await sleep();

  const dataPortoNumberNotFound = portoNumbersNotFound.map(number => ({numeropropostaporto: number, value: 'N/A'}))

  generateCSV({filePath: 'EP-NUMEROS-NAO-ENCONTRADOS', data: dataPortoNumberNotFound})
  generateCSV({filePath: 'EP-SETEMBRO-EXTRACAO-CORRIGIDA', data: generateDate})

  console.log('Finish:', {
    time: `${timerProccess} second${timerProccess > 1 ? 's' : ''}`
  });

  clearInterval(timer);
}

const generateCCR = async () => {
  console.log('Processing...');
  const filenames = fs.readdirSync('files/kibana/CCR');
  const extractionAllData = {};
  const portoNumbers = [];
  const dataCCR = [];
  const portoNumbersNotFound = [];
  const numbersDuplicated = [];
  const cauculationsFixed = [];
  let countFounded = 0;
  let timerProccess = 0;

  const timer = setInterval(() => {
    timerProccess++;
  }, 1000);

  fs.unlink('CCR-EXTRACAO-CORRIGIDA.csv', function (err){
    if (err) console.log('File non exists!');
  })

  fs.unlink('CCR-NUMEROS-NAO-ENCONTRADOS.csv', function (err){
    if (err) console.log('File non exists!');
  })

  for (let fileName of filenames) {
    await getDataExtraction({filePath: `files/kibana/CCR/${fileName}`, fn: (data) => {
      const dataParsed = JSON.parse(data['message.inputStr']);
      portoNumbers.push(dataParsed.calculo.numero);
      if (extractionAllData[dataParsed.calculo.numero]) numbersDuplicated.push(dataParsed.calculo.numero);
      extractionAllData[dataParsed.calculo.numero] = dataParsed;
    }});
  }

  await getDataExtraction({filePath: 'files/email/CCR-AGOSTO.csv', fn: (data) => {
    dataCCR.push(data);
  }});

  await getDataExtraction({filePath: 'files/email/CCR-SETEMBRO.csv', fn: (data) => {
    dataCCR.push(data);
  }});

  dataCCR.forEach(ccr => {
    const findData = extractionAllData[ccr.numeropropostaporto];
    if (findData) {
      countFounded++;
      const fixedCalculation = fixCalculationInformations({calculo: findData.calculo, ...ccr});
      cauculationsFixed.push({naoSalvarDados: true, ...findData, calculo: fixedCalculation });
    } else {
      portoNumbersNotFound.push(ccr.numeropropostaporto);
    }
  })

  const generateDate = cauculationsFixed.map(item => ({
    empresa: 4,
    produto: 151,
    num_orcamento: item.orcnum,
    json: JSON.stringify(item)
  }));

  const dataPortoNumberNotFound = portoNumbersNotFound.map(number => ({numeropropostaporto: number, value: 'N/A'}))

  generateCSV({filePath: 'CCR-NUMEROS-NAO-ENCONTRADOS', data: dataPortoNumberNotFound})
  generateCSV({filePath: 'CCR-EXTRACAO-CORRIGIDA', data: generateDate});

  console.log('Finish:', {
    time: `${timerProccess} second${timerProccess > 1 ? 's' : ''}`,
    totalRegistros2PlanilhasRecebidasEmail: dataCCR.length,
    totalRegistrosFiltradosKibana: portoNumbers.length,
    totalRegistrosEncontrados: countFounded,
    totalRegistrosNaoEncontrados: portoNumbersNotFound.length,
    numbersDuplicated: numbersDuplicated.length
  });

  clearInterval(timer);
}

generateEP();
generateCCR()










