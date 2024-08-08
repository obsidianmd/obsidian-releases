# Obsidian Plugin: Auto Generator Plugin

This is a plugin for Obsidian (https://obsidian.md).

This project uses Typescript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

**Note:** The Obsidian API is still in early alpha and is subject to change at any time!

This plugin is designed specially for iWhaleCloud users, it can do:
- Take advantage of the Docchain and ChatGPT API to automatically generate texts
- Automatically generate the index according to your requirements
- Automatically generate the document according to the existing index, paragraph by paragraph, marked by ##
- Able to save your file to another address

## Settings:

You need to provide the server address and the ChatGPT token. These two shall be fit in the settings.

## Use:
You need to provide the Docchain username, Docchain password and the assigned Docchain topic-id for the input, as well as offer your requirements.
Attention: topic-id should be chosen carefully according to the exact type of document you wish to generate, such as the esg report of all varieties of industries.
Moreover, you should make sure that the Docchain username and Docchain password are valid and the topic-id does exists in the name of the corresponding Docchain user.


## Example:
It is allowed that you input your own index to generate the document. But make sure that it is of the right format as follows:
The index should possess 1 title marked by #, all the sub-indexes should be marked by ##, and ### marks their subtitles.It is ok if there isn't ###.
An instance is shown below:
#ESG报告
## 1. 产品与服务
1. SHS-5
2. SHS-6
3. 416-1
4. 416-2
5. 417-1

## 2. 供应链管理
1. SOC-2
2. SOC-3

## 3. 重人本的员工发展
1. 员工权益
2. SOC-6

## 4. 成长平台
1. SOC-4
2. SOC-7

## 5. 报告内容
1. IPIECA/API（2020）
2. GRI 2021

## 6. 心理健康与关爱员工
1. SHS-1
2. SHS-2
3. 403-3

## 7. 社会责任与社区关系
1. 本土化与多元化
2. SOC-4
3. SOC-5
4. SOC-15

## 8. 绿色环保
1. 绿色动力
2. 储量接替率

## 9. 技术创新
1. 中国石油年度十大科技进展
2. 研发经费投入

## 10. 企业数字化与智能化转型
1. 信息技术
2. 智慧能源与化工产业

## 11. 社区沟通与参与
1. 哈法亚公司
2. 印度尼西亚公司
3. 社区权益保障

## 12. ESG（环境、社会、治理）实践总结

## 13. 石油精神与企业文化
1. 感动石油人物
2. 石油精神与铁人精神



## Attention

- Once you click the Document button, the index is saved inside the program and all your effort to change the index will fail, which means that all the document generated will be based on your previous index.
- If you click on the Reset button, the index will be shown(But you should probably save the document before clicking on for the ducument will be missing once you click on it).
- You should not click on the Document button or the Regenerate button when the generating process is not complete!


## API Documentation

See https://github.com/obsidianmd/obsidian-api
