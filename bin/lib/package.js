/*
 * @Author: Devin Shi
 * @Email: yutian.shi@definesys.com
 * @Date: 2019-11-05 14:08:21
 * @LastEditTime: 2019-11-06 18:03:08
 * @LastEditors: Devin Shi
 * @Description: 
 */
const shell = require('shelljs');
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
const axios = require('axios');
const zipper = require("zip-local");

module.exports = async (cmd, program) => {
  let dapCli ;
  if (!fs.existsSync(path.resolve(`${process.cwd()}`, '.dap-cli.json'))) {

    // 打印数据
    console.log('当前目录下没有.dap-cli.json文件，不是一个dap插件项目'['red']);
    shell.exit(1);
  } else {
    const dapCliConfigFile = path.resolve(process.cwd(), '.dap-cli.json')
    const dapCliString = fs.readFileSync(dapCliConfigFile, 'utf-8');
    dapCli = JSON.parse(dapCliString);
  }

  if (!(dapCli && dapCli.name)) {
    console.log('.dap-cli.json格式不正确，请插件相关配置的格式'['red']);
    shell.exit(1)
  }
  // 插件该目录是否有 process.cmd() 文件
  console.log('1. 开始打包插件文件...')

  const pluginsDir = path.resolve(process.cwd(), "./src/plugins/")
  const assetsDir = path.resolve(process.cwd(), "./src/assets/plugins/")
  const dapCliJsonPath = path.resolve(process.cwd(), "./.dap-cli.json")


  const distDir = path.resolve(process.cwd(), "./node_modules/.dap-package/")

  const distZipPath = path.resolve(process.cwd(), "./node_modules/.dap-package/dap-plugin.zip")

  const distSrcDir = path.resolve(process.cwd(), "./node_modules/.dap-package/src")
  const distAssetsDir = path.resolve(process.cwd(), "./node_modules/.dap-package/src/assets")

  if (fs.existsSync(distDir)) {
    shell.rm('-rf', distDir);
    shell.mkdir('-p', distSrcDir);
    shell.mkdir('-p', distAssetsDir);
  } else {
    shell.mkdir('-p', distSrcDir);
    shell.mkdir('-p', distAssetsDir);
  }

  shell.cp('-Rf', `${pluginsDir}/`, distSrcDir)
  shell.cp('-Rf', `${assetsDir}/`, distAssetsDir)
  shell.cp('-Rf', `${dapCliJsonPath}`, distDir)

  zipper.sync.zip(distDir).compress().save(`${distZipPath}`);

  console.log('2. 插件文件打包成功...'['green'])

  console.log('3. 开始文件上传')

  let form = new FormData()
  form.append('file',fs.createReadStream(`${distZipPath}`),'plugins.zip')

  var uploadFormHeaders = async function(form) {
      let resultHeaders = await (new Promise((resolve,reject)=>{
        form.getLength((err,length)=>{
          if(err) {
            reject(err)
          }
          let headers = Object.assign({'Content-Length':length},form.getHeaders())
          resolve(headers)
        })
      }))
      return resultHeaders;
  }

  let headers = await uploadFormHeaders(form);
  var uploadZipFun = async function() {
    try {
      axios.defaults.headers.post['Content-Type'] = 'multipart/form-data';
      let res = await axios.request({
        url: 'http://k8s.definesys.com:30601/compile/',
        method: 'post',
        data: form,
        // 修改请求头才能传文件
        headers: {...headers},
        onUploadProgress: function (progressEvent) {
          console.log(progressEvent)
        },
      });  
      return res ;
    } catch(err) {
      console.log((err + '')['red'])
      shell.exit(1)
    }
  }
  
  let res = await uploadZipFun();
  
  console.log(`4. 远程打包开始`)
  console.log(`5. 可以在此等待打包结果，大概3~5分钟。也可以直接使用如下链接查看或下载打包目录`)
  console.log(`${res.data.data}`['green'])
  console.log(`正在开始打包...`['yellow'])

  let timeAll = 0 ;

  const downloadZipDist = path.resolve(process.cwd(), (dapCli.dist && dapCli.dist.outputPath) || './dist/')

  if(!fs.existsSync(downloadZipDist)) {
    shell.mkdir('-p', downloadZipDist)
  } else {
    shell.rm('-rf', downloadZipDist)
    shell.mkdir('-p', downloadZipDist)
  }

  var uploadZipFun = function() {
    axios.request({
      url: `${res.data.data}`,
      method: 'get',
      responseType: "stream"
    }).then(res => {
      if (res.headers['status'] === 'completed') {
        const savePath = path.resolve(downloadZipDist) + '/' + ((dapCli.dist && dapCli.dist.outputName) || 'view.zip');
        const writerStream = fs.createWriteStream(savePath)
        writerStream.on('finish', function() {
          console.log(`文件打包完成`['green']);
          console.log(`文件保存完毕,最终保存在 ${savePath} 目录中`['green']);
        });
        
        writerStream.on('error', function(err){
          console.log(err.stack);
          shell.exit(1);
        });
        res.data.pipe(writerStream);
      } else if (res.headers['status'] === 'waiting') {
        if (timeAll >= 60 * 1000 * 5) {
          console.log('下载时长超过5分钟,建议使用URL下载，下载地址如下:'['red'])
          console.log(`${res.data.data}`['red'])
          shell.exit(1);
        }
        setTimeout(() => {
          timeAll += 30000;
          console.log(`文件打包中,请耐心等待, 预计还需要${(300000 - timeAll) / 60000}分钟...`['yellow']);
          uploadZipFun()
        }, 30000)
      }
    }).catch(error => {
      console.log(error);
    })
  }

  uploadZipFun();
}