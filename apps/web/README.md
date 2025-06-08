# Web

## 🐛 Fix

- [ ] performance issue in mermaid rendering
- [ ] performance issue in chat field input
- [ ] formatting styles in markdown sometimes not rendered correctly in ordered list
- [ ] sometimes response text includes ````markdown```` block (look into `fwgamx3VLYjuB1jy.json` chat log), we need to parse it as regular markdown instead of code block. Or adjust system prompt to avoid this

## 🎯 Todo

- [ ] setup auth with better-auth
- [ ] implement share in chat history, after we setup auth
- [ ] implement rename in chat history
- [ ] implement archive in chat history
- [ ] Add a document/artifact/canvas mode for content creation, artifact type: text (markdown), code editor, spreadsheet, image, etc

## 📝 Notes

- chat history saved in `.chats` folder as JSON file
- "human in the loop" are only supported in `models.flash20`

## 🚧 How to Debug

- add breakpoint anywhere in the code
- use vscode `launch.json` "Next.js: debug full stack with Chrome" to debug the full stack app
