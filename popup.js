    document.getElementById('btn').addEventListener('click', showColorPicker);
    document.getElementById('btn2').addEventListener('click', startDehighlighting);
    document.getElementById('btn3').addEventListener('click',downloadPDF ) ;
    

    function showColorPicker() {
        const colorPickerContainer = document.getElementById('colorPickerContainer');
        colorPickerContainer.style.display = 'block';
        document.getElementById('btn').textContent = 'Apply Highlight';
        document.getElementById('btn').removeEventListener('click', showColorPicker);
        document.getElementById('btn').addEventListener('click', applyHighlight);
    }
    
    function applyHighlight() {
        const selectedColor = document.getElementById('colorPicker').value ;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: startHighlighting,
                args: [selectedColor]
            });
        });
        document.getElementById('btn').textContent = 'Highlight';
        document.getElementById('colorPickerContainer').style.display = 'none'; // Hide the color picker after applying the highlight
        document.getElementById('btn').removeEventListener('click', applyHighlight); // Remove the apply highlight event listener
        document.getElementById('btn').addEventListener('click', showColorPicker); // Re-attach the initial event listener
        document.getElementById('colorPicker').value='none' ;
    }



    function startHighlighting(color) {
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
          span.dataset.id = Date.now();  // Assign unique ID
          // span.dataset.highlightId = Date.now() ;
          let clonedRange = range.cloneRange();
          let contents = clonedRange.extractContents();
          span.appendChild(contents);
          clonedRange.insertNode(span);
          // clonedRange.surroundContents(span);
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
    }



function startDehighlighting() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: removeHighlighting
        });
    });
    document.getElementById('btn2').removeEventListener('click', startDehighlighting);
}



function removeHighlighting() {
    document.body.style.cursor = 'crosshair';
    document.addEventListener('click', dehighlightText)
    function dehighlightText(event) {
        let target = event.target;
        const annotation = {
          content: target.innerHTML,
          backgroundColor: target.style.backgroundColor,
          url: window.location.href,
          id:target.dataset.id
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
            parent.normalize(); // This will merge adjacent text nodes
        }
        document.body.style.cursor = 'default';
        document.removeEventListener('click', dehighlightText);
    }
}


const url= windows.location.href ;
const annotationsUrl = `http://localhost:8000/annotations`;



function toExport(){
  console.log('okay') ;
  downloadPDF() ;
  document.getElementById('exportButton').removeEventListener('click', toExport);
}


function downloadPDF() {
  console.log('exxx') ;
  fetch(annotationsUrl)
      .then(response => response.json())
      .then(data => {
        console.log("data") ;
        // const { jsPDF } = window.jspdf ;
        const doc = new jsPDF() ;
        data.forEach(annotationSet => {
          doc.text(`URL - ${annotationSet.url}`, 10, 10);
          doc.autoTable({
            head: [["Content", "Note"]],
            body: annotationSet.annotations.map(annotation => [annotation.content, annotation.note || ""]),
          });
          doc.addPage() ;
        });
        doc.save("Annotations.pdf");
      })
      .catch(error => console.error('Error fetching annotations:', error));


}