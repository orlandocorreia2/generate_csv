import csv from 'csv-parser';
import fs from 'fs';
import { genereateJSONFile, generateCSV } from './util.js';

const getDataExtracao = () => {
  return new Promise((resolve, _) => {
    const response = [];
  
    fs.createReadStream("extracao.csv")
    .pipe(csv())
    .on("data", (data) => {
      const [numOrcamento, json] = data['orc;json'].split(';');
      if (json != '#N/D') {
        const jsonParse = JSON.parse(json.substr(1, json.length - 2));
        response.push({numOrcamento, json: jsonParse })
      }
    })
    .on("end", () => {
      resolve(response);
    });
  })
}

const getEPSeptember = () => {
  return new Promise((resolve, _) => {
    const response = [];
    fs.createReadStream("EP-SETEMBRO.csv")
    .pipe(csv())
    .on("data", (data) => {
      response.push(data);
    })
    .on("end", () => {
      resolve(response);
    });
  }) 
}

const getCCRAugust = () => {
  return new Promise((resolve, _) => {
    const response = [];
    fs.createReadStream("CCR-AGOSTO.csv")
    .pipe(csv())
    .on("data", (data) => {
      response.push(data);
    })
    .on("end", () => {
      resolve(response);
    });
  }) 
}



const getCCRSeptember = () => {
  return new Promise((resolve, _) => {
    const response = [];
    fs.createReadStream("CCR-SETEMBRO.csv")
    .pipe(csv())
    .on("data", (data) => {
      response.push(data);
    })
    .on("end", () => {
      resolve(response);
    });
  }) 
}

const init = async () => {
  const totalRegistersAltered = {
    premio_informado: 0,
    parcelas: 0,
    valor_divida: 0,
    tipo_remuneracao_rep: 0,
    tipo_remuneracao_cor: 0
  };
  const dataExtracao = await getDataExtracao();
  const dataEpSeptember = await getEPSeptember();
  dataExtracao.forEach((dataExtracaoItem, index) => {
    const findDataEpSeptember = dataEpSeptember.filter(item => item.numeropropostaporto == dataExtracaoItem.numOrcamento);
    const {calculo} = dataExtracaoItem.json;
    const {premio_informado, parcelas, valor_divida} = findDataEpSeptember[0];
    // Prêmio Informado
    if (calculo.precificacao.premio.informado != premio_informado) {
      calculo.precificacao.premio.informado = premio_informado;
      totalRegistersAltered.premio_informado++;
    }
    calculo.contratantes.forEach(calculoContratante => {
      // Parcelas
      let {quantidadeParcelas} = calculoContratante.dadosPagamento;
      if (quantidadeParcelas != parcelas) {
        quantidadeParcelas = parcelas;
        totalRegistersAltered.parcelas++;
      }
      // Valor Dívida
      calculoContratante.grupos.forEach(calculoContratanteGrupo => {
        calculoContratanteGrupo.segurados.forEach(calculoContratanteGrupoSegurado => {
          calculoContratanteGrupoSegurado.coberturas.forEach(calculoContratanteGrupoSeguradoCobertura => {
            if (['RIT', 'DES'].includes(calculoContratanteGrupoSeguradoCobertura.sigla)) {
              if (calculoContratanteGrupoSeguradoCobertura.valor != valor_divida) {
                totalRegistersAltered.valor_divida++;
                calculoContratanteGrupoSeguradoCobertura.valor = valor_divida;
              }
            }
          })
        })
      })
    })
    // Remuneracoes
    calculo.remuneracoes.forEach(remuneracao => {
      if (remuneracao.tipoRemuneracao == 'REP') {
        if (remuneracao.percentual != 70) {
          remuneracao.percentual = 70;
          totalRegistersAltered.tipo_remuneracao_rep++;
        }
      }
      if (remuneracao.tipoRemuneracao == 'COR') {
        if (remuneracao.percentual != 1.8) {
          remuneracao.percentual = 1.8;
          totalRegistersAltered.tipo_remuneracao_cor++;
        }
      }
    })
  })
  const generateDate = dataExtracao.map(item => ({
    empresa: 4,
    produto: 151,
    num_orcamento: item.numOrcamento,
    json: JSON.stringify(item.json)
  }));
  generateCSV({filePath: 'extracao-corrigida', data: generateDate})
  console.log(totalRegistersAltered)
}

// init();

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

const generateCCR = async () => {
  console.log('Processing...');

  fs.unlink('EXTRACAO-CORRIGIDA-CCR.csv', function (err){
    if (err) throw err;
  })

  fs.unlink('CCR-NUMEROS-NAO-ENCONTRADOS.csv', function (err){
    if (err) throw err;
  })

  let timerProccess = 0;
  const timer = setInterval(() => {
    timerProccess++;
  }, 1000);

  const filenames = fs.readdirSync('files/CCR');
  // const filenames = ['01-12-08-2024.csv']
  const extractionAllData = {};
  const portoNumbers = [];
  const dataCCR = [];
  let countFounded = 0;
  const portoNumbersNotFound = [];
  const dataExtractionFounded = [];
  const numbersDuplicated = [];

  for (let fileName of filenames) {
    await getDataExtraction({filePath: `files/CCR/${fileName}`, fn: (data) => {
      const dataParsed = JSON.parse(data['message.inputStr']);
      portoNumbers.push(dataParsed.calculo.numero);
      if (extractionAllData[dataParsed.calculo.numero]) numbersDuplicated.push(dataParsed.calculo.numero);
      extractionAllData[dataParsed.calculo.numero] = dataParsed;
    }});
  }

  await getDataExtraction({filePath: 'CCR-AGOSTO.csv', fn: (data) => {
    dataCCR.push(data);
  }});

  await getDataExtraction({filePath: 'CCR-SETEMBRO.csv', fn: (data) => {
    dataCCR.push(data);
  }});

  dataCCR.forEach(ccr => {
    if (extractionAllData[ccr.numeropropostaporto]) {
      // Gerar Planilha pra subir no oracle
      countFounded++;
      const {calculo} = extractionAllData[ccr.numeropropostaporto];
      const {premio_informado, parcelas, valor_divida} = ccr;
      // Prêmio Informado
      calculo.precificacao.premio.informado = premio_informado;
      calculo.contratantes.forEach(calculoContratante => {
        // Parcelas
        calculoContratante.dadosPagamento.quantidadeParcelas = parcelas;
        // Valor Dívida
        calculoContratante.grupos.forEach(calculoContratanteGrupo => {
          calculoContratanteGrupo.segurados.forEach(calculoContratanteGrupoSegurado => {
            calculoContratanteGrupoSegurado.coberturas.forEach(calculoContratanteGrupoSeguradoCobertura => {
              if (['RIT', 'DES'].includes(calculoContratanteGrupoSeguradoCobertura.sigla)) {
                calculoContratanteGrupoSeguradoCobertura.valor = valor_divida;
              }
            })
          })
        })
      })
      // Remuneracoes
      calculo.remuneracoes.forEach(remuneracao => {
        if (remuneracao.tipoRemuneracao == 'REP') {
          remuneracao.percentual = 70;
        }
        if (remuneracao.tipoRemuneracao == 'COR') {
          remuneracao.percentual = 1.8;
        }
      })
      dataExtractionFounded.push({calculo});
    } else {
      portoNumbersNotFound.push(ccr.numeropropostaporto);
    }
  })

  const generateDate = dataExtractionFounded.map(item => ({
    empresa: 4,
    produto: 151,
    num_orcamento: item.calculo.numero,
    json: JSON.stringify(item.calculo)
  }));
  generateCSV({filePath: 'EXTRACAO-CORRIGIDA-CCR', data: generateDate})
  
  const dataPortoNumberNotFound = portoNumbersNotFound.map(number => ({numeropropostaporto: number, value: 'N/A'}))

  generateCSV({filePath: 'CCR-NUMEROS-NAO-ENCONTRADOS', data: dataPortoNumberNotFound})

  const results = {
    totalRegistros2PlanilhasRecebidasEmail: dataCCR.length,
    totalRegistrosFiltradosKibana: portoNumbers.length,
    totalRegistrosEncontrados: countFounded,
    totalRegistrosNaoEncontrados: portoNumbersNotFound.length,
    numbersDuplicated: numbersDuplicated.length
  }

  console.log("Resultado: ", results);
  clearInterval(timer);
  console.log(`Time: ${timerProccess} seconds`)
}

generateCCR()










