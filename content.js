console.log('content.js loaded') ;



const url = window.location.href;
console.log(url) ;
const annotationsUrl = `http://localhost:8000/annotations?url=${encodeURIComponent(url)}`;



document.addEventListener('highlight-selected-text', showColorPicker) ;
document.addEventListener('dehighlight-selected-text', removeHighlighting) ;
document.addEventListener('search-annotation', createKeywordPopup) ;


function showColorPicker() {
  let colorPickerContainer = document.getElementById('colorPickerContainer');
  if (!colorPickerContainer) {
    createColorPicker();
    colorPickerContainer = document.getElementById('colorPickerContainer');
  }
  colorPickerContainer.style.display = 'block';
}



function createColorPicker() {
  const colorPickerContainer = document.createElement('div');
  colorPickerContainer.id = 'colorPickerContainer';
  colorPickerContainer.style.position = 'fixed';
  colorPickerContainer.style.top = '10px';
  colorPickerContainer.style.right = '10px';
  colorPickerContainer.style.zIndex = '1000';
  colorPickerContainer.style.backgroundColor = 'black';
  colorPickerContainer.style.color = 'white';
  colorPickerContainer.style.border = '2px solid white';
  colorPickerContainer.style.borderRadius ='10px';
  colorPickerContainer.style.padding = '10px';
  colorPickerContainer.style.display = 'none'; 

  const label = document.createElement('label');
  label.setAttribute('for', 'colorPicker');
  label.innerText = 'Choose highlight color:';
  label.style.marginRight = '10px';
  label.style.backgroundColor= 'black' ;

  const select = document.createElement('select');
  select.id = 'colorPicker';
  select.style.backgroundColor= 'black' ;

  const colors = [
    {value:'none', label:'None'},
    { value: 'yellow', label: 'Yellow' },
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'pink', label: 'Pink' }
  ];

  colors.forEach(color => {
    const option = document.createElement('option');
    option.value = color.value;
    option.innerText = color.label;
    option.style.backgroundColor='black' ;
    select.appendChild(option);
  });

  colorPickerContainer.appendChild(label);
  colorPickerContainer.appendChild(select);

  document.body.appendChild(colorPickerContainer);

  select.addEventListener('change', () => {
    const selectedColor = select.value;
    if(selectedColor!=='none'){
    startHighlighting(selectedColor);
  }
    colorPickerContainer.style.display = 'none';  // Hide after selecting a color
    select.value = 'none' ;
  });
}




function startHighlighting(color) {
  console.log(color) ;
  document.body.style.cursor = 'crosshair';
  document.addEventListener('click', highlightText);

  function highlightText(event) {
    let selection = window.getSelection();
    if (!selection.isCollapsed) {
      let range = selection.getRangeAt(0);
      let text = range.toString();

      let span = document.createElement('span');
      span.style.backgroundColor = color;
      span.dataset.content = text;
      span.dataset.url = window.location.href;
      span.dataset.id = Date.now(); 
      let clonedRange = range.cloneRange();
      let contents = clonedRange.extractContents();

      span.appendChild(contents);
      clonedRange.insertNode(span);
      const annotation = {
        content: span.innerHTML,
        backgroundColor: span.style.backgroundColor,
        url: window.location.href,
        id: Date.now()
      };
      fetch('http://localhost:8000/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(annotation)
      })
      .then(response => response.json())
      .then(data => console.log('Annotation stored:', data));
      selection.removeAllRanges();
    }
    document.body.style.cursor = 'default';
    document.removeEventListener('click', highlightText);
  }
  document.addEventListener('click', highlightText);
}



function removeHighlighting() {
  document.body.style.cursor = 'crosshair';
  document.addEventListener('click', dehighlightText);

  function dehighlightText(event) {
      let target = event.target;

      const annotation = {
        content: target.innerHTML,
        backgroundColor: target.style.backgroundColor,
        url: window.location.href,
        id: target.dataset.id
      };
      fetch('http://localhost:8000/annotations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(annotation)
      })
      .then(response => {
        if (!response.ok) {
            throw new Error('Failed to remove annotation');
        }
        console.log('Annotation removed successfully');
      })
      .catch(error => {
          console.error('Error removing annotation:', error);
      });
      if (target.tagName === 'SPAN' && target.style.backgroundColor) {
          let parent = target.parentNode;
          while (target.firstChild) {
              parent.insertBefore(target.firstChild, target);
          }
          parent.removeChild(target);
          parent.normalize();
      }
      document.body.style.cursor = 'default';
      document.removeEventListener('click', dehighlightText);
  }
}




function setupContextMenu() {
  document.addEventListener('contextmenu', function(event) {
    let target = event.target;
    if (target.tagName === 'SPAN' && target.style.backgroundColor) {
      event.preventDefault();
      let note = prompt('Enter a note for this highlight:');
      if (note !== null) {
        const content = target.innerHTML;
        const color = target.style.backgroundColor ;
        const url = window.location.href;
        const id= target.dataset.id ;
        fetch('http://localhost:8000/annotations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, url,color, note,id })
        })
        .then(response => response.json())
        .then(data => {
          console.log('Annotation updated with note:', data);
          target.title = note;
        })
        .catch(error => console.error('Error updating annotation with note:', error));
      }
    }
  });
}








function applyStoredHighlights() {
  fetch(annotationsUrl)
      .then(response => response.json())
      .then(data => {
        const urlAnnotations = data.find(item => item.url === url);
        if (urlAnnotations && urlAnnotations.annotations) {
          urlAnnotations.annotations.forEach(annotation => {
            highlightStoredText(annotation.content, annotation.backgroundColor,annotation.note,annotation.id);
          });
        }
      })
      .catch(error => console.error('Error fetching annotations:', error));
}


function findTextNode(node, text) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue.includes(text)) {
      return node;
    }
  } else {
    for (let i = 0; i < node.childNodes.length; i++) {
      const found = findTextNode(node.childNodes[i], text);
      if (found) {
        return found;
      }
    }
  }
  return null;
}


function highlightStoredText(content, backgroundColor,note,id) {
  const root = document.body; 
  let startIndex = 0;
  let textNode;
  while ((textNode = findTextNode(root, content))) {
    const nodeValue = textNode.nodeValue;
    startIndex = nodeValue.indexOf(content, startIndex);
    if (startIndex === -1) {
      break;
    }
    const range = document.createRange();
    range.setStart(textNode, startIndex);
    range.setEnd(textNode, startIndex + content.length);
    const span = document.createElement('span');
    span.style.backgroundColor = backgroundColor;
    range.surroundContents(span);
    span.title=note ;
    span.dataset.id= id ;
    startIndex += content.length;
  }
}


function createKeywordPopup() {
  // Create the search popup container
  const popupContainer = document.createElement('div');
  popupContainer.id = 'keywordPopupContainer';
  popupContainer.style.position = 'fixed';
  popupContainer.style.top = '50%';
  popupContainer.style.left = '50%';
  popupContainer.style.transform = 'translate(-50%, -50%)';
  popupContainer.style.zIndex = '1000';
  popupContainer.style.backgroundColor = 'black';
  popupContainer.style.border = '2px solid white';
  popupContainer.style.padding = '20px';

  const label = document.createElement('label');
  label.setAttribute('for', 'keywordInput');
  label.innerText = 'Enter keyword:';
  label.style.marginRight = '10px';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'keywordInput';

  const submitButton = document.createElement('button');
  submitButton.innerText = 'Search';

  popupContainer.appendChild(label);
  popupContainer.appendChild(input);
  popupContainer.appendChild(submitButton);
  document.body.appendChild(popupContainer);

  submitButton.addEventListener('click', () => {
    const keyword = input.value.trim();
    console.log(keyword) ;
    if (keyword) {
      popupContainer.remove(); 
      fetchAllAnnotationsAndScroll(keyword);
    }
  });

  document.addEventListener('click', function(event) {
    if (!popupContainer.contains(event.target) && event.target !== document.getElementById('searchButton')) {
      popupContainer.remove();
    }
  }, { once: true });
}


function fetchAllAnnotationsAndScroll(keyword) {
  fetch('http://localhost:8000/annotations')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch annotations');
      }
      return response.json();
    })
    .then(data => {
      data.forEach(entry => {
        entry.annotations.forEach(annotation => {
          if (annotation.content && annotation.content.includes(keyword)) {
            console.log("scrolling") ;
            console.log(annotation.content) ;
            const highlightedElement = document.querySelector(`[data-id="${annotation.id}"]`);
            if (highlightedElement) {
              highlightedElement.scrollIntoView() ;
            } else {
              console.log("Annotation not present") ;
            }
          }
          else
          console.log(" Annotation not present") ;
        });
      });
    })
    .catch(error => {
      console.error('Error fetching annotations:', error);
    });
}



if (document.readyState === 'complete') {
  applyStoredHighlights() ; 
} else {
  window.addEventListener('load', applyStoredHighlights);
  window.addEventListener('load', setupContextMenu);
}
