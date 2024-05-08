var http = require("http");
var url = require('url');
var echarts = require("echarts");
const { createCanvas } = require("canvas");
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const args = process.argv;
// 保存console.log输出的内容到日志文件
const logFilePath = path.join(__dirname,'logs','output.log');
// 重定向console.log的输出到日志文件
const logStream = fs.createWriteStream(logFilePath,{ flags: 'a', encoding: 'utf-8' });
console.log = function () {
  const logText = Array.from(arguments).join(' ');
  logStream.write(`${dayjs().format('YYYY-MM-DD HH:mm:ss')}: ${logText}\n`);
  process.stdout.write(`${logText}\n`); // 如果还想在控制台输出，取消注释此行
};
console.error = function () {
  const logText = Array.from(arguments).join(' ');
  logStream.write(`${dayjs().format('YYYY-MM-DD HH:mm:ss')}-error: ${logText}\n`);
  process.stdout.write(`${logText}\n`); // 如果还想在控制台输出，取消注释此行
};
console.warn = function () {
  const logText = Array.from(arguments).join(' ');
  logStream.write(`${dayjs().format('YYYY-MM-DD HH:mm:ss')}-warn: ${logText}\n`);
  process.stdout.write(`${logText}\n`); // 如果还想在控制台输出，取消注释此行
};
const mime = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "image/svg+xml": "svg"
};

const mimeReverse = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  pdf: "application/pdf",
  svg: "image/svg+xml"
};

const port = args.slice(2)[0] || 3000;

echarts.setPlatformAPI({
  // Same with the old setCanvasCreator
  createCanvas() {
    return createCanvas();
  }
});

function processConfig(request,response,callback) {
  if (typeof callback !== 'function') {
    return null
  }
  if (request.method === 'GET') {
    // Parse url parameters
    let params = url.parse(request.url,true).query;
    if (!params.config) {
      console.error('request parameter "config" invalid!')
      response.end(JSON.stringify({
        code: 400,
        msg: 'request parameter "config" invalid!',
        data: null
      }));
      return
    }
    request.config = params.config;
    callback();
  } else {
    // Parse the body parameter
    let body = '';
    request.on('data',function (chunk) {
      body += chunk;
      if (body.length > 1e6) {
        console.error('request body too large!')
        response.end(JSON.stringify({
          code: 400,
          msg: 'request body too large!',
          data: null
        }))
      }
    });
    request.on('end',function () {
      request.config = body;
      callback();
    })
  }
}

function renderChart(config) {
  let result;
  const canvas = createCanvas(config.width,config.height);
  const chart = echarts.init(canvas);
  chart.setOption(config.option);
  if (config.base64) {
    const base64 = canvas.toDataURL(config.formatType);
    //  const base64=chart.getDataURL();
    result = JSON.stringify({
      code: 200,
      msg: 'success',
      data: base64
    });
  } else {
    result = canvas.toBuffer(config.formatType);
  }
  chart.dispose();

  return result;
}

http.createServer(function (req,res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Content-Type','application/json;charset=UTF-8');
  processConfig(req,res,function () {
    let config;
    try {
      config = JSON.parse(req.config);
    } catch (e) {
      console.log('request parameter "config" format invalid, is not JSON!')
      console.error(e)
      res.end(JSON.stringify({
        code: 400,
        msg: 'request parameter "config" format invalid, is not JSON!',
        data: null
      }));
      return
    }
    if (!config || !config.option) {
      console.error('request parameter "config" format invalid, option is required!')
      console.error(e)
      res.end(JSON.stringify({
        code: 400,
        msg: 'request parameter "config" format invalid, option is required!',
        data: null
      }));
      return
    }

    // width: The chart width
    config.width = config.width || 600;
    // height: The chart height
    config.height = config.height || 400;
    // type: The format: png, jpeg, pdf, svg.
    config.type = config.type || 'png';
    config.formatType = 'image/png';
    config.contentType = 'image/png';
    // base64: Bool, set to true to get base64 back instead of binary.
    config.base64 = (config.base64 === true);
    // download: Bool, set to true to send attachment headers on the response.
    config.download = (config.download === true);
    switch (config.type) {
      case 'png':
        config.formatType = 'image/png';
        config.contentType = 'image/png';
        break;
      case 'jpeg':
        config.formatType = 'image/jpeg';
        config.contentType = 'image/jpeg';
        break;
      case 'svg':
      case 'pdf':
      default:
        config.formatType = 'image/png';
        config.contentType = 'image/png';
        config.type = 'png';
    }

    if (config.base64) {
      config.contentType = 'application/json;charset=UTF-8';
    }
    // "Content-Type": "image/png"
    // "Content-Type": "image/jpeg"
    // "Content-Type": "application/json;charset=UTF-8"
    res.setHeader('Content-Type',config.contentType);
    if (config.download) {
      res.setHeader('Content-Disposition','attachment; filename="chart.' + config.type + '"');
    }

    let result;
    try {
      result = renderChart(config);
    } catch (e) {
      console.error("Error: Canvas rendering failed!" + e.message);
      res.setHeader('Content-Type','application/json;charset=UTF-8');
      result = JSON.stringify({
        code: 500,
        msg: 'Error: Canvas rendering failed! The content of the request parameter "option" may be invalid!',
        data: config.option
      });
    }
    console.log(result)
    res.write(result);
    res.end();
  })
}).listen(port,function () {
  console.log('Server is started at port ' + port + ' ...');
});

