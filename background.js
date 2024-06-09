chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});


chrome.commands.onCommand.addListener((command) => {
  if (command === "highlight-text") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: highlightSelectedText
      });
    });
  }
  else if(command === "dehighlight-text") {
    chrome.tabs.query({ active:true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id },
        function: dehighlightTheText
      });
    });
  }
  else if(command === "search-ann") {
    chrome.tabs.query({ active:true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id },
        function: SearchAnnotation
      });
    });
  }
});

function highlightSelectedText() {
  document.dispatchEvent(new CustomEvent('highlight-selected-text'));
}
function dehighlightTheText() {
  document.dispatchEvent(new CustomEvent('dehighlight-selected-text'));
}
function SearchAnnotation() {
  document.dispatchEvent(new CustomEvent('search-annotation'));
}
