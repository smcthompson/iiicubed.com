var codes = document.querySelectorAll('code');

for (var code of codes) {
  if (code.parentElement.tagName === 'BODY')
    code.innerHTML = '<pre>' + code.textContent.split('\n').join('</pre>\n<pre>') + '</pre>';
  code.title = 'Click to copy...';
  code.onclick = () => {
    var text = event.target.textContent;
    navigator.clipboard.writeText(text);
  };
}
