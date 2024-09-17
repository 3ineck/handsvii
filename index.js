import express from "express";
import mysql from "mysql";

const app = express();

//MYSQL
const MYSQL_IP = "localhost";
const MYSQL_LOGIN = "root";
const MYSQL_PASSWORD = "raphael#CRUZ";

//MYSQL Conexão
let con = mysql.createConnection({
  host: MYSQL_IP,
  user: MYSQL_LOGIN,
  password: MYSQL_PASSWORD,
  database: "imobiliaria",
});

con.connect(function (err) {
  if (err) {
    console.log(err);
    throw err;
  }
  console.log("MySQL conectado.");
});

//Acesso ao /imoveis
app.get("/imoveis", function (req, res) {
  con.query("SELECT * FROM imovel;", function (err, imoveis, fields) {
    if (err) throw err;
    res.send(JSON.stringify(imoveis));
  });
});

//Acesso ao /pagamentos
app.get("/pagamentos", function (req, res) {
  con.query("SELECT * FROM pagamento;", function (err, pagamentos, fields) {
    if (err) throw err;
    res.send(JSON.stringify(pagamentos));
  });
});

//Acesso ao /join
app.get("/join", function (req, res) {
  con.query(
    "SELECT * FROM pagamento INNER JOIN imovel ON pagamento.codigo_imovel = imovel.codigo_imovel;",
    function (err, join, fields) {
      if (err) throw err;
      res.send(JSON.stringify(join));
    }
  );
});

//Acesso ao /somatorio_por_id
//Ao acessar essa url o usuário terá o somatório dos valores para cada id
app.get("/somatorio_por_id", function (req, res) {
  con.query("SELECT * FROM pagamento;", function (err, pagamentos, fields) {
    if (err) throw err;

    //Criação de um objeto map
    let somatorioPorId = new Map();

    //Criação de um loop para verificar todas as linhas dos dados recebidos do banco de dados
    pagamentos.forEach((pagamento) => {
      //Setado a chave como o código do imóvel
      let chave = pagamento["codigo_imovel"];

      //Caso o código do imóvel verificado não existir no objeto somatorioPorId, criar ele
      if (somatorioPorId.get(chave) === undefined) {
        somatorioPorId.set(chave, {
          codigo: pagamento["codigo_imovel"],
          somatorio: pagamento["valor"],
        });
        //Caso o código do imóvel já existir no objeto somatorioPorId, somar o novo valor ao valor já salvo
      } else {
        somatorioPorId.get(chave).somatorio += pagamento["valor"];
      }
    });

    //Criação da array para retornar ao usuário
    let arraySomatorioPorId = Array.from(somatorioPorId.values());

    //Enviar a array em formato JSON
    res.send(JSON.stringify(arraySomatorioPorId));
  });
});

//Acesso ao /somatorio_por_mes
//Ao acessar essa url o usuário terá o somatório dos valores para cada mês
app.get("/somatorio_por_mes", function (req, res) {
  con.query("SELECT * FROM pagamento;", function (err, pagamentos, fields) {
    if (err) throw err;

    //Criação de um objeto map
    let somatorioPorMes = new Map();

    //Criação de um loop para verificar todas as linhas dos dados recebidos do banco de dados
    pagamentos.forEach((pagamento) => {
      let data = pagamento.data_do_pagamento;
      let mes = data.getMonth() + 1; //É somado +1, porque por convensão Janeiro é 0. Então para melhor entendimento foi somado 1
      let ano = data.getFullYear();

      //Setado a chave como o mes/ano
      let chave = mes + "/" + ano;

      //Caso mes/ano não existir no objeto somatorioPorMes, criar ele
      if (somatorioPorMes.get(chave) === undefined) {
        somatorioPorMes.set(chave, {
          mes: mes + "/" + ano,
          somatorio: pagamento["valor"],
        });
        //Caso mes/ano já existir no objeto somatorioPorMes, somar o novo valor ao valor já salvo
      } else {
        somatorioPorMes.get(chave).somatorio += pagamento["valor"];
      }
    });

    //Criação da array para retornar ao usuário
    let arraySomatorioPorMes = Array.from(somatorioPorMes.values());

    //Enviar a array em formato JSON
    res.send(JSON.stringify(arraySomatorioPorMes));
  });
});

//Acesso ao /porcentagem_imovel
//Ao acessar essa url, o usuário terá acesso as dados de quantos porcentos cada tipo de imóvel representa do total de vendas
app.get("/porcentagem_imovel", function (req, res) {
  con.query(
    "SELECT * FROM pagamento INNER JOIN imovel ON pagamento.codigo_imovel = imovel.codigo_imovel;",
    function (err, transacoes, fields) {
      if (err) throw err;

      //Criação de um objeto map
      let porcentagemTotal = new Map();

      //Na variável somaTotal será somado todos os valores, porque posteriormente será usada para calcular a porcentagem
      let somaTotal = 0;

      //Criação de um loop para verificar todas as linhas dos dados recebidos do banco de dados
      transacoes.forEach((transacao) => {
        //Setado a chave como o tipo de imovel
        let chave = transacao["tipo_imovel"];

        //Caso o tipo de imovel verificado não existir no objeto porcentagemTotal, criar ele
        if (porcentagemTotal.get(chave) === undefined) {
          porcentagemTotal.set(chave, {
            tipo_imovel: transacao["tipo_imovel"],
            somatorio: transacao["valor"],
            porcentagem: 0,
            porcentagem_formatada: "",
          });
          //Caso o tipo de imovel já existir no objeto porcentagemTotal, somar o novo valor ao valor já salvo
        } else {
          porcentagemTotal.get(chave).somatorio += transacao["valor"];
        }

        somaTotal += transacao["valor"];
      });

      //Calculo das porcentagem
      //Feito um loop pelo objeto porcentagemTotal para calcular as porcentagens
      porcentagemTotal.forEach((imovel) => {
        //Feito o arredondamento da divisão do valor pelo total (procentagem do total), com duas casas decimais
        let porcentagem =
          Math.round((imovel.somatorio / somaTotal) * 100) / 100;

        //Feito uma formatação para ficar como número inteiro
        let porcentagemFormatada = Math.round(
          (imovel.somatorio / somaTotal) * 100
        );

        //Salvar os valores
        imovel.porcentagem = porcentagem;
        imovel.porcentagem_formatada = porcentagemFormatada + "%";
      });

      //Criação da array para retornar ao usuário
      let arrayPorcentagemTotal = Array.from(porcentagemTotal.values());

      //Enviar a array em formato JSON
      res.send(JSON.stringify(arrayPorcentagemTotal));
    }
  );
});

//Conexão com o servidor
let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}

//Retorno da conexão
app.listen(port, function () {
  console.log("Servidor ligado!");
});
