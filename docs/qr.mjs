import React from "/Users/zahir/buildathon/node_modules/react/index.js";
import { renderToStaticMarkup } from "/Users/zahir/buildathon/node_modules/react-dom/server.node.js";
import { QRCodeSVG } from "/Users/zahir/buildathon/node_modules/qrcode.react/lib/esm/index.js";
import { writeFileSync } from "node:fs";
const url = "https://buildathon.mtcatucsd.org/replit-setup.pdf";
const svg = renderToStaticMarkup(React.createElement(QRCodeSVG,{value:url,size:512,level:"M",marginSize:0,bgColor:"#FAF6F1",fgColor:"#191818"}));
writeFileSync("assets/qr.svg", svg.replace("<svg ", "<svg xmlns=\"http://www.w3.org/2000/svg\" "));
