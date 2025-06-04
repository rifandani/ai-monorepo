# Web

## 🐛 Fix

- [ ] error `Maximum update depth exceeded.` when using `useAutoScroll` in `chat.client.tsx`
- [ ] performance issue in chat
- [ ] formatting in markdown sometimes it's not rendered correctly especially in ordered list

## 🎯 Todo

- [ ] Add a document/artifact/canvas mode for content creation, artifact type: text (markdown), code editor, spreadsheet, image, etc
- [ ] sometimes response text includes ````markdown```` block (look into `fwgamx3VLYjuB1jy.json` chat log), we need to parse it as regular markdown instead of code block. Or adjust system prompt to avoid this

## 📝 Notes

- chat history saved in `.chats` folder
