/*
 * @Author: Devin Shi
 * @Email: yutian.shi@definesys.com
 * @Date: 2019-11-05 14:08:21
 * @LastEditTime: 2019-11-06 16:54:22
 * @LastEditors: Devin Shi
 * @Description: 
 */
const program = require('commander');
const shelljs = require('shelljs');
const package = require('../../package.json');
const userHome = require('user-home');
const fs = require('fs')
const path = require('path')
const colors = require('colors');

module.exports = (name, cmd, program) => {

  if (!name) {
    program.help()
    return
  }

  console.log('1. 开始初始化插件模板.....')
  // 从服务器下载资源到xxxx目录
  const gitTemplateRepo = `${userHome}/.dapCliRepo`

  const projectPath = path.resolve(`${process.cwd()}`, `dap-plugin-scaffold-${name}/`);
  
  const pluginsPath = path.resolve(`${projectPath}`, 'src/plugins');
  
  shelljs.rm('-rf', gitTemplateRepo);
  shelljs.mkdir('-p' , gitTemplateRepo);

  //检查控制台是否以运行`git `开头的命令
  if (!shelljs.which('git')) {
    //在控制台输出内容
    console.log('error 本机上没有git，请检查git是否安装或相关环境变量是否正确'['red']);
    shelljs.exit(1);
  }

  shelljs.exec(`git clone http://git.definesys.com/shiyutian/dap-plugin-scaffold.git ${gitTemplateRepo}`);
  // clone(`https://github.com/shiyutian123/dap-plugin-scaffold.git`, `${gitTemplateRepo}`)

  console.log('2. 插件初始化成功'['green'])

  console.log('3. 开始生成插件工程')
  if (fs.existsSync(projectPath)) {
    // 当前路径已经在相关工程
    console.log('error 当前路径已经存在工程，请检查相关目录设置'['red'])
    shelljs.exit(1);
  } else {
    shelljs.mkdir('-p', `${process.cwd()}`)
  }

  // 替换目录中文本为xxxx
  shelljs.rm('-rf', path.resolve(`${gitTemplateRepo}`, '.git'))
  shelljs.cp('-R', `${gitTemplateRepo}/.`, `${process.cwd()}/dap-plugin-scaffold-${name}`)

  const fileList = fs.readdirSync(pluginsPath);

  fileList.forEach((fileName) => {
    if (fileName.indexOf('__{PLUGIN_NAME}__') !== -1) {
      fs.renameSync(path.resolve(pluginsPath, fileName), path.resolve(pluginsPath, name))
    } else if (fileName.indexOf('index.ts') !== -1) {
      fs.readFile(path.resolve(pluginsPath, fileName), 'utf-8', function(err, files) {
        var result = files.replace(new RegExp("__{PLUGIN_NAME}__"), `${name}/`)
        fs.writeFile(path.resolve(pluginsPath, fileName), result, 'utf8', function (err) {
          if (err) return console.log(err);
        });
      })
    }
  })

  console.log('4. 插件工程生成完成'['green'])

  console.log('接下来,执行如下命令, 开始开发新插件吧'['green'])
  console.log(`cd dap-plugin-scaffold-${name}`['green'])
  console.log('npm install'['green'])
  console.log('npm run start'['green'])
}