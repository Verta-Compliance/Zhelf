curl -i -X POST "http://localhost:3000/api/messages" `
  -H "Content-Type: application/json" `
  --data @"$PSScriptRoot/sample-data.json"
