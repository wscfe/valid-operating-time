/*
 * @Author: wangshicheng
 * @Date: 2021-09-11 13:52:09
 * @Description:
 * @FilePath: /clip-img/examples/demo1/app.ts
 */
console.log('demo01')

import TsSdk from '../../src/index'

const addResult = TsSdk.add(1, 2)
document.querySelector('.result').innerHTML = JSON.stringify(addResult)
