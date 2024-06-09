const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

let annotations = {} ;

app.post('/annotations', (req, res) => {
    const { content, backgroundColor, url,id } = req.body;

    if (!content || !backgroundColor || !url || !id) {
        console.error('Missing data in request body:', req.body);
        return res.status(400).json({ error: 'Invalid data' });
    }
    if (!annotations[url]) {
      annotations[url] = [];
    }
    annotations[url].push({content, backgroundColor, id});
    console.log(`Stored annotation for ${url}:`, { content, backgroundColor, id});
    res.status(201).json({
        message: 'Annotation stored successfully',
        annotation: { content, backgroundColor, url, id}
    });
});

app.get('/annotations', (req, res) => {
    const allAnnotations = Object.keys(annotations).map(key => ({
        url: key,
        annotations: annotations[key]
    }));
    res.status(200).json(allAnnotations);
});

app.delete('/annotations', (req, res) => {
      console.log('deleting...') ;
      const { content, color,url,id } = req.body ;
      if (!content || !url) {
        console.error('Missing data in request body:', req.body);
        return res.status(400).json({ error: 'Invalid data' });
      }
      if (!annotations[url]) {
        return res.status(404).json({ error: 'No annotations found for the given URL' });
      }
      const initialLength = annotations[url].length;
      annotations[url] = annotations[url].filter(annotation => annotation.content !== content);
      if (annotations[url].length === initialLength) {
        return res.status(404).json({ error: 'Annotation not found' });
      }
      console.log(`Deleted annotation for ${url}:`, { content });
      res.status(200).json({
        message: 'Annotation deleted successfully',
        annotation: { content, url }
      });
});


app.put('/annotations', (req, res) => {
    const { content, url, color,note,id } = req.body;
    if (!content || !url || !color || !note) {
      console.error('Missing data in request body:', req.body);
      return res.status(400).json({ error: 'Invalid data' });
    }
    if (!annotations[url]) {
      return res.status(404).json({ error: 'No annotations found for the given URL' });
    }
    const annotation = annotations[url].find(ann => ann.content === content);
    if (annotation) {
      annotation.note = note;
      console.log(`Updated annotation for ${url}:`, { content,color, note });
      res.status(200).json({
        message: 'Annotation updated successfully',
        annotation: {content,url,color,note}
      });
    } else {
      return res.status(404).json({ error: 'Annotation not found' });
    }
  });


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
