// Quick test to verify AI APIs work
const GEMINI_KEY = 'AIzaSyCFD1VUg4Aco2mAuYQscoI_-A1fgiz43qo';

fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{
      parts: [{ text: 'Explain a basic BJJ closed guard escape in 2 sentences.' }]
    }]
  })
})
.then(r => r.json())
.then(data => {
  if (data.candidates) {
    console.log('✅ GEMINI WORKS:', data.candidates[0].content.parts[0].text);
  } else {
    console.log('❌ GEMINI FAILED:', JSON.stringify(data, null, 2));
  }
})
.catch(err => console.log('❌ ERROR:', err));
