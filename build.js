const fs = require('fs'), path = require('path');
const r = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const gameParts = fs.readdirSync(path.join(__dirname, 'src/game')).filter(f => f.endsWith('.js')).sort();
const game = "(() => {\n'use strict';\n" + gameParts.map(f => `/* --- ${f} --- */\n` + r('game/' + f)).join('\n') + "\n})();";
const scripts = [
  r('balance.js').replace("if (typeof module !== 'undefined') module.exports = BAL;", ''),
  r('art.js'), r('art_hero.js'), r('art_pets.js'), r('art_extra.js'), r('audio.js'), r('platform.js'), r('net.js'), game,
].join('\n');
const GOOGLE = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800;900&family=Russo+One&display=swap">`;
function page(fonts) {
  return r('shell.html').replace('<!--FONTS-->', () => fonts).replace('/*STYLE*/', () => r('style.css')).replace('/*SCRIPTS*/', () => scripts);
}
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/klinok-sakury.html'), page(GOOGLE));
fs.writeFileSync(path.join(__dirname, 'dist/game.js'), scripts);
// сборка для Яндекс Игр: полноценный документ, SDK площадки, локальные шрифты
const ya = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Клинок Сакуры</title>
<script src="/sdk.js"></script>
<link rel="stylesheet" href="fonts/fonts.css">
<style>
:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${page('').replace(/<title>[^<]*<\/title>\n?/, '').replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n?/, '')}
</body>
</html>`;
fs.mkdirSync(path.join(__dirname, 'dist/yandex'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/yandex/index.html'), ya);
fs.mkdirSync(path.join(__dirname, 'dist/yandex/fonts'), { recursive: true });
// шрифты лежат локально: на Яндекс Играх внешние запросы запрещены
fs.cpSync(path.join(__dirname, 'fonts'), path.join(__dirname, 'dist/yandex/fonts'), { recursive: true });
console.log('artifact', fs.statSync(path.join(__dirname, 'dist/klinok-sakury.html')).size, 'yandex', ya.length);
