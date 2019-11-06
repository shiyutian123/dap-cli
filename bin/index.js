#!/usr/bin/env node
/*
 * @Author: Devin Shi
 * @Email: yutian.shi@definesys.com
 * @Date: 2018-11-24 01:49:46
 * @LastEditTime: 2019-11-06 09:14:18
 * @LastEditors: Devin Shi
 * @Description: 
 */
const program = require('commander');
const shelljs = require('shelljs');
const package = require('../package.json');
const userHome = require('user-home');
const fs = require('fs')
const path = require('path')
const colors = require('colors');

program
  .version(package.version)
  .usage('<command> [option]')

program
  .command('init <name>')
  .description('init project with dap-cli-service')
  .action((name, cmd) => {
    require(`./lib/${cmd._name}`)(name, cmd, program)
  })

program
  .command('package')
  .description('package project with dap-cli-service')
  .action((cmd) => {
    require(`./lib/${cmd._name}`)(cmd, program)
  })

program
  .parse(process.argv);

if (!program.args || !program.args.length) {
  program.help();
  return;
}